
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  type Auth,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { auth, db, createTemporaryAuthInstance } from '@/lib/firebase'; // Import primary auth and db
import type { UserProfile, AuthContextType } from '@/types';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate random password
const generateRandomPassword = (length: number = 8): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return userDocSnap.data() as UserProfile;
      }
      console.log(`No user profile found for UID: ${uid}`);
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const fetchedProfileData = await fetchUserProfile(firebaseUser.uid);
        if (fetchedProfileData) {
          setUserProfile(fetchedProfileData);
        } else {
           // If no profile data, but firebaseUser exists, ensure userProfile is nullified if it's for a different user
           if (userProfile && userProfile.uid !== firebaseUser.uid) { 
             setUserProfile(null);
           }
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); // Removed userProfile from dependency array to avoid potential loops

 const signUpParent = async (details: Omit<UserProfile, 'uid' | 'role' | 'points' | 'parentId'> & {password: string}): Promise<FirebaseUser | null> => {
    setLoading(true);
    const { email, password, name, gender, age, phone } = details;
    if (!email || !password || !name || gender === undefined || age === undefined || !phone) { 
      console.error("All fields are required for parent sign up.");
      setLoading(false);
      return null;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password); 
      const parentUser = userCredential.user;
      await updateProfile(parentUser, { displayName: name });

      const parentProfileData: UserProfile = {
        uid: parentUser.uid,
        role: 'parent',
        email: parentUser.email!,
        name,
        gender,
        age,
        phone,
      };
      await setDoc(doc(db, 'users', parentUser.uid), parentProfileData);
      setLoading(false);
      return parentUser;
    } catch (error: any) {
      console.error("Error signing up parent:", error.message, error.code);
      setLoading(false);
      return null;
    }
  };

  const signInParentWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password); 
      // Profile will be fetched by onAuthStateChanged
      setLoading(false);
      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in parent:", error.message, error.code);
      setLoading(false);
      return null;
    }
  };

  const signInChildWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const childUser = userCredential.user;
      // It's crucial to verify this user is indeed a child
      const profile = await fetchUserProfile(childUser.uid);
      if (profile && profile.role === 'child') {
        setLoading(false);
        return childUser;
      } else {
        // If not a child, sign out this user from the main auth state to prevent unauthorized access
        await signOut(auth); 
        throw new Error("Not a valid child account.");
      }
    } catch (error: any) {
      console.error("Error signing in child:", error.message, error.code);
      setLoading(false);
      return null;
    }
  };

  const signUpChildAndLinkToParent = async (
    parentAuthUid: string, 
    childDetails: { name: string, email: string }
  ): Promise<{ userProfile: UserProfile; generatedPassword?: string } | null> => {
    setLoading(true);
    let tempAuthManager: { tempAuth: Auth; cleanup: () => Promise<void> } | null = null;
    
    try {
      tempAuthManager = await createTemporaryAuthInstance();
      const { tempAuth, cleanup } = tempAuthManager;

      const generatedPassword = generateRandomPassword(8);
      
      const childAuthCredential = await createUserWithEmailAndPassword(tempAuth, childDetails.email, generatedPassword);
      const newChildUser = childAuthCredential.user;

      await updateProfile(newChildUser, { displayName: childDetails.name });

      const childProfileForUsersCollection: UserProfile = {
        uid: newChildUser.uid,
        role: 'child',
        email: childDetails.email,
        displayName: childDetails.name,
        parentId: parentAuthUid,
        points: 0,
      };
      await setDoc(doc(db, 'users', newChildUser.uid), childProfileForUsersCollection);

      const childSubcollectionRef = collection(db, 'users', parentAuthUid, 'children');
      // Here, we are adding a new document to the subcollection.
      // If you need to update an existing one, you'd need its ID.
      // For now, each call to this function adds a new child record to the subcollection.
      await addDoc(childSubcollectionRef, {
        name: childDetails.name,
        email: childDetails.email,
        points: 0,
        authUid: newChildUser.uid, 
        createdAt: serverTimestamp(),
        initialPassword: generatedPassword, // Store the generated password
      });
      
      console.log(`Child Auth user and profile created for ${childDetails.name}. UID: ${newChildUser.uid}. Initial Password: ${generatedPassword}`);
      
      await cleanup(); 
      setLoading(false);
      return { userProfile: childProfileForUsersCollection, generatedPassword };

    } catch (error: any) {
      console.error("Error in signUpChildAndLinkToParent:", error.message, error.code);
      if (tempAuthManager) {
        await tempAuthManager.cleanup(); 
      }
      setLoading(false);
      return null;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    const currentRole = userProfile?.role;
    try {
      await signOut(auth); 
      // After sign out, user and userProfile will be set to null by onAuthStateChanged
      // Redirect based on role before sign-out
      if (currentRole === 'parent') {
        router.push('/parent/login');
      } else if (currentRole === 'child') {
        router.push('/login'); 
      } else {
        router.push('/'); 
      }
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
        // setLoading(false); // onAuthStateChanged will handle loading state
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email); 
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error("Error sending password reset email:", error.message);
      setLoading(false);
      return false;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    isParent: userProfile?.role === 'parent',
    isChild: userProfile?.role === 'child',
    signUpParent,
    signInParentWithEmail,
    signInChildWithEmail,
    signUpChildAndLinkToParent,
    signOutUser,
    fetchUserProfile,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

