
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
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { auth, db, createTemporaryAuthInstance } from '@/lib/firebase'; // Import primary auth and db
import type { UserProfile, AuthContextType, Child } from '@/types';
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
  }, []);

 const signUpParent = async (details: Omit<UserProfile, 'uid' | 'role' | 'points' | 'parentId'> & {password: string}): Promise<FirebaseUser | null> => {
    setLoading(true);
    const { email, password, name, gender, age, phone } = details;
    if (!email || !password || !name || gender === undefined || age === undefined || !phone) { // check gender and age explicitly
      console.error("All fields are required for parent sign up.");
      setLoading(false);
      return null;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password); // Use primary auth
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password); // Use primary auth
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
    // Child login will use the primary auth instance by default,
    // as it's expected the app is already configured for it.
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const childUser = userCredential.user;
      const profile = await fetchUserProfile(childUser.uid);
      if (profile && profile.role === 'child') {
        setLoading(false);
        return childUser;
      } else {
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
      
      // 1. Create Firebase Auth user for the child using the temporary auth instance
      const childAuthCredential = await createUserWithEmailAndPassword(tempAuth, childDetails.email, generatedPassword);
      const newChildUser = childAuthCredential.user;

      // (Optional) Update child's auth profile displayName if needed (using tempAuth)
      await updateProfile(newChildUser, { displayName: childDetails.name });

      // 2. Create child's main profile in /users collection (using primary db)
      const childProfileForUsersCollection: UserProfile = {
        uid: newChildUser.uid,
        role: 'child',
        email: childDetails.email,
        displayName: childDetails.name,
        parentId: parentAuthUid,
        points: 0,
      };
      await setDoc(doc(db, 'users', newChildUser.uid), childProfileForUsersCollection);

      // 3. Create/Update child record in parent's subcollection (using primary db)
      //    For simplicity, we'll add a new one. If updating, you'd need the childDocId.
      const childSubcollectionRef = collection(db, 'users', parentAuthUid, 'children');
      const childDocInSubcollection = await addDoc(childSubcollectionRef, {
        name: childDetails.name,
        email: childDetails.email,
        points: 0,
        authUid: newChildUser.uid, // Store the actual Firebase Auth UID
        createdAt: serverTimestamp(),
      });
      
      console.log(`Child Auth user and profile created for ${childDetails.name}. UID: ${newChildUser.uid}`);
      
      await cleanup(); // Clean up the temporary app
      setLoading(false);
      return { userProfile: childProfileForUsersCollection, generatedPassword };

    } catch (error: any) {
      console.error("Error in signUpChildAndLinkToParent:", error.message, error.code);
      if (tempAuthManager) {
        await tempAuthManager.cleanup(); // Ensure cleanup on error
      }
      setLoading(false);
      return null;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    const currentRole = userProfile?.role;
    try {
      await signOut(auth); // Sign out from primary auth
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
        setLoading(false); 
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email); // Use primary auth
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
