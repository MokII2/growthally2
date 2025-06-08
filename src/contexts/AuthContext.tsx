
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
  }, []); // Removed userProfile from dependency array to prevent re-fetches on local profile changes

 const signUpParent = async (details: Omit<UserProfile, 'uid' | 'role' | 'points' | 'parentId' | 'hobbies'> & {password: string}): Promise<FirebaseUser | null> => {
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
      const profile = await fetchUserProfile(childUser.uid);
      if (profile && profile.role === 'child') {
        setLoading(false);
        return childUser;
      } else {
        await signOut(auth); // Sign out if not a valid child
        setLoading(false);
        console.error("Attempted login for non-child account or profile missing.");
        return null; // Return null to indicate failure
      }
    } catch (error: any) {
      console.error("Error signing in child:", error.message, error.code);
      setLoading(false);
      return null;
    }
  };

  const signUpChildAndLinkToParent = async (
    parentAuthUid: string,
    childDetails: {
      name: string;
      emailPrefix: string;
      gender: 'male' | 'female';
      age: number;
      hobbies: string[];
    }
  ): Promise<{ userProfile?: UserProfile; generatedPassword?: string; error?: { code?: string; message?: string } }> => {
    setLoading(true);
    let tempAuthManager: { tempAuth: Auth; cleanup: () => Promise<void> } | null = null;
    const fullEmail = `${childDetails.emailPrefix}@growthally.com`;

    try {
      tempAuthManager = await createTemporaryAuthInstance();
      const { tempAuth, cleanup } = tempAuthManager;

      const generatedPassword = generateRandomPassword(8);

      const childAuthCredential = await createUserWithEmailAndPassword(tempAuth, fullEmail, generatedPassword);
      const newChildUser = childAuthCredential.user;

      await updateProfile(newChildUser, { displayName: childDetails.name });

      const childProfileForUsersCollection: UserProfile = {
        uid: newChildUser.uid,
        role: 'child',
        email: fullEmail,
        displayName: childDetails.name,
        parentId: parentAuthUid,
        points: 0,
        gender: childDetails.gender,
        age: childDetails.age,
        hobbies: childDetails.hobbies,
      };
      await setDoc(doc(db, 'users', newChildUser.uid), childProfileForUsersCollection);

      const childSubcollectionDocData: Omit<Child, 'id'> = {
        name: childDetails.name,
        email: fullEmail,
        points: 0,
        authUid: newChildUser.uid,
        createdAt: serverTimestamp(),
        initialPassword: generatedPassword,
        gender: childDetails.gender,
        age: childDetails.age,
        hobbies: childDetails.hobbies,
      };
      await addDoc(collection(db, 'users', parentAuthUid, 'children'), childSubcollectionDocData);

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
      // Instead of throwing, return an error object
      return { error: { code: error.code, message: error.message } };
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    const currentRole = userProfile?.role;
    try {
      await signOut(auth);
      // Clear local state immediately
      setUser(null);
      setUserProfile(null);
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
        setLoading(false); // Ensure loading is set to false even if navigation hasn't completed
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
