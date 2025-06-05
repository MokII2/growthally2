
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, AuthContextType } from '@/types';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          // If profile fetch failed (returned null):
          // Check if there's an existing userProfile in state with the same UID.
          // This can happen if a sign-in function (e.g., signInParentAnonymously)
          // set the profile, and Firestore read consistency caused fetchUserProfile 
          // to return null temporarily for the new record.
          // In this case, we don't want to nullify the already set profile.
          if (!(userProfile && userProfile.uid === firebaseUser.uid)) {
            // Only set to null if there's no existing matching profile in state.
            setUserProfile(null);
          }
          // If userProfile (from state) exists and userProfile.uid matches firebaseUser.uid,
          // we preserve the userProfile state, assuming it was correctly set by a sign-in function.
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); // Keep dependency array empty for onAuthStateChanged setup

  const signInParentAnonymously = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const parentUser = userCredential.user;
      if (parentUser) {
        const parentProfileData: UserProfile = {
          uid: parentUser.uid,
          role: 'parent',
        };
        await setDoc(doc(db, 'users', parentUser.uid), parentProfileData);
        setUser(parentUser);
        setUserProfile(parentProfileData); // Set profile directly
      }
      setLoading(false);
      return parentUser;
    } catch (error) {
      console.error("Error signing in parent anonymously:", error);
      setLoading(false);
      return null;
    }
  };

  const signInChildWithEmail = async (email: string, password: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const childUser = userCredential.user;
      if (childUser) {
         const profile = await fetchUserProfile(childUser.uid);
         if (profile && profile.role === 'child') {
            setUser(childUser);
            setUserProfile(profile);
         } else {
            await signOut(auth); 
            throw new Error("Invalid child account.");
         }
      }
      setLoading(false);
      return childUser;
    } catch (error) {
      console.error("Error signing in child:", error);
      setLoading(false);
      return null;
    }
  };
  
  const signUpChildAndLinkToParent = async (parentAuthUid: string, childDetails: { name: string, email: string, password?: string }): Promise<UserProfile | null> => {
    setLoading(true);
    if (!childDetails.password) { 
        childDetails.password = Math.random().toString(36).slice(-8);
    }
    try {
      const childProfile: UserProfile = {
        uid: `temp_child_uid_${Date.now()}`, 
        role: 'child',
        email: childDetails.email,
        displayName: childDetails.name,
        parentId: parentAuthUid,
        points: 0,
      };
      const childDocRef = await addDoc(collection(db, 'users', parentAuthUid, 'children'), {
        name: childDetails.name,
        email: childDetails.email,
        points: 0,
      });
      setLoading(false);
      return childProfile; 
    } catch (error) {
      console.error("Error signing up child:", error);
      setLoading(false);
      return null;
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      router.push('/'); 
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setLoading(false);
  };

  const value = {
    user,
    userProfile,
    loading,
    isParent: userProfile?.role === 'parent',
    isChild: userProfile?.role === 'child',
    signInParentAnonymously,
    signInChildWithEmail,
    signUpChildAndLinkToParent,
    signOutUser,
    fetchUserProfile,
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
