
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, writeBatch } from 'firebase/firestore';
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
          // If profile is not found, it might be a new user or an error.
          // For existing sessions, this could mean the DB doc was deleted.
          // For new sign-ups, profile is set during sign-up.
           if (userProfile && userProfile.uid !== firebaseUser.uid) { // only reset if it's a different user profile
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
  }, []); // Removed userProfile from dependency array to avoid loops if fetchUserProfile is unstable

 const signUpParent = async (details: Omit<UserProfile, 'uid' | 'role' | 'points' | 'parentId'> & {password: string}): Promise<FirebaseUser | null> => {
    setLoading(true);
    const { email, password, name, gender, age, phone } = details;
    if (!email || !password || !name || !gender || age === undefined || !phone) {
      console.error("All fields are required for parent sign up.");
      setLoading(false);
      return null;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const parentUser = userCredential.user;

      // Update Firebase Auth user's display name (optional, but good practice)
      await updateProfile(parentUser, { displayName: name });

      const parentProfileData: UserProfile = {
        uid: parentUser.uid,
        role: 'parent',
        email: parentUser.email!, // email is guaranteed from createUserWithEmailAndPassword
        name,
        gender,
        age,
        phone,
      };
      await setDoc(doc(db, 'users', parentUser.uid), parentProfileData);
      // setUser(parentUser); // Auth state listener will handle this
      // setUserProfile(parentProfileData); // Auth state listener will fetch this
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
      const parentUser = userCredential.user;
      // Auth state listener will fetch and set user and userProfile
      setLoading(false);
      return parentUser;
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
      // Auth state listener will fetch and set user and userProfile
      // Ensure the fetched profile has role 'child'
      const profile = await fetchUserProfile(childUser.uid);
      if (profile && profile.role === 'child') {
        setLoading(false);
        return childUser;
      } else {
        await signOut(auth); // Sign out if not a valid child
        throw new Error("Not a valid child account.");
      }
    } catch (error: any) {
      console.error("Error signing in child:", error.message, error.code);
      setLoading(false);
      return null;
    }
  };

  // This function now aims to create a Firebase Auth user for the child
  // AND a profile in /users collection AND a record in parent's /children subcollection
  const signUpChildAndLinkToParent = async (parentAuthUid: string, childDetails: { name: string, email: string, password?: string }): Promise<UserProfile | null> => {
    setLoading(true);
    const childPassword = childDetails.password || Math.random().toString(36).slice(-8); // Auto-generate if not provided

    // This part is tricky because we're creating a new Firebase Auth user,
    // which is usually done client-side by the user themselves.
    // For a parent creating a child account, you'd typically use Firebase Admin SDK on a backend.
    // Doing it client-side like this requires re-authenticating as the child to set up their profile or a more complex flow.
    // For simplicity in this context, we'll focus on creating the DB records.
    // A proper child auth creation would be more involved.

    // Current approach: Create child record in parent's subcollection.
    // Create a profile in /users for the child (which implies they can login directly later)
    // For a real app, creating Firebase Auth user for child should be done carefully.
    
    try {
      // Firestore batch write
      const batch = writeBatch(db);

      // 1. Create child document in parent's subcollection
      const childSubcollectionRef = doc(collection(db, 'users', parentAuthUid, 'children'));
      batch.set(childSubcollectionRef, {
        name: childDetails.name,
        email: childDetails.email,
        points: 0,
        // authUid will be set if we successfully create an auth user.
      });
      
      // SIMULATING child user profile creation for now.
      // In a real app, if you create an Auth user for the child, use their actual UID here.
      // This example will just create the profile document in /users.
      // It won't create an actual Firebase Auth user without more complex steps or Admin SDK.

      const tempChildUid = `child_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const childUserProfileRef = doc(db, 'users', tempChildUid);
      const childProfileForUsersCollection: UserProfile = {
        uid: tempChildUid, // This would be the actual Firebase Auth UID of the child if created
        role: 'child',
        email: childDetails.email,
        displayName: childDetails.name,
        parentId: parentAuthUid,
        points: 0,
      };
      batch.set(childUserProfileRef, childProfileForUsersCollection);
      
      await batch.commit();

      console.log(`Child record and simulated profile created for ${childDetails.name}. Email: ${childDetails.email}, TempUID: ${tempChildUid}`);
      // NOTE: This does NOT create a Firebase Auth user. For direct child login,
      // you'd need a separate flow for the child to register with email/password or use Admin SDK.
      // The 'signInChildWithEmail' would require a real Firebase Auth user.
      
      setLoading(false);
      return childProfileForUsersCollection; // Return the profile data created in /users
    } catch (error: any) {
      console.error("Error in signUpChildAndLinkToParent:", error.message, error.code);
      setLoading(false);
      return null;
    }
  };


  const signOutUser = async () => {
    setLoading(true);
    const currentRole = userProfile?.role;
    try {
      await signOut(auth);
      // setUser and setUserProfile will be cleared by onAuthStateChanged
      // Redirect based on role before sign-out
      if (currentRole === 'parent') {
        router.push('/parent/login');
      } else if (currentRole === 'child') {
        router.push('/login'); // Child login page
      } else {
        router.push('/'); // Role selection
      }
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
        setLoading(false); // Ensure loading is set to false
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
