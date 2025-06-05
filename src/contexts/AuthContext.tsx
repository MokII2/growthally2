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
        const profile = await fetchUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInParentAnonymously = async (): Promise<FirebaseUser | null> => {
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const parentUser = userCredential.user;
      if (parentUser) {
        const parentProfile: UserProfile = {
          uid: parentUser.uid,
          role: 'parent',
        };
        await setDoc(doc(db, 'users', parentUser.uid), parentProfile);
        setUser(parentUser);
        setUserProfile(parentProfile);
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
            // This account is not a child account or profile doesn't exist
            await signOut(auth); // Sign out if role mismatch
            throw new Error("Invalid child account.");
         }
      }
      setLoading(false);
      return childUser;
    } catch (error) {
      console.error("Error signing in child:", error);
      setLoading(false);
      // Consider using useToast here for user feedback
      return null;
    }
  };
  
  // This function is more complex as it involves creating a new Firebase Auth user
  // and then linking them. For simplicity, we'll assume child account is created
  // by parent providing email/password. The actual auth creation for child happens here.
  const signUpChildAndLinkToParent = async (parentAuthUid: string, childDetails: { name: string, email: string, password?: string }): Promise<UserProfile | null> => {
    setLoading(true);
    if (!childDetails.password) { // Generate a temporary password if not provided
        childDetails.password = Math.random().toString(36).slice(-8);
        // Potentially email this to the parent or display it.
        // For now, this is simplified.
    }
    try {
      // This part should ideally be done via a server-side function for security if creating users directly.
      // For client-side, this is a simplified approach.
      // Create child auth user (this might be better handled by an admin SDK on backend or cloud function)
      // For now, we'll create it and assume the parent is responsible.
      // This approach creates the user on the client, which is generally not recommended for production flows
      // without proper security rules or backend involvement.
      // For this example, we proceed with client-side creation.
      // Consider alternative: parent adds child details, child receives invite to set up account.

      // Temporary sign out current user (parent) to create child account
      // This is tricky and not ideal. Firebase Admin SDK is better for this.
      // For now, we will skip direct auth creation here and assume child account creation is handled externally or parent sets details.
      // And focus on linking an existing child's UID after they've signed up separately or parent helps them.
      // Simplified: just add to firestore
      
      // A better flow: Parent adds child details (name, email). System emails child an invite.
      // Child clicks invite, sets password, account created.
      // For now: Parent "adds" a child by providing details, and we manually create their entry.
      // Actual auth creation for child needs separate handling.

      // Let's assume for now child is added by creating a Firestore record under parent.
      // And the child will sign up separately or parent helps them.
      // This function will primarily add the child's data to the parent's subcollection.
      
      const childProfile: UserProfile = {
        uid: `temp_child_uid_${Date.now()}`, // Placeholder UID, real UID after child auth
        role: 'child',
        email: childDetails.email,
        displayName: childDetails.name,
        parentId: parentAuthUid,
        points: 0,
      };

      // Add to parent's children subcollection (using a generated ID for now)
      const childDocRef = await addDoc(collection(db, 'users', parentAuthUid, 'children'), {
        name: childDetails.name,
        email: childDetails.email,
        points: 0,
        // authUid will be updated once child actually logs in / account is created.
      });
      
      // Add to global users collection (again, UID is placeholder)
      // This part would be done when child actually signs up.
      // await setDoc(doc(db, 'users', childProfile.uid), childProfile);

      // This function needs rethinking for a real app.
      // For now, it's a placeholder for adding child data under parent.
      // Real child auth creation needs careful design.

      setLoading(false);
      return childProfile; // Returning a placeholder profile
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
      router.push('/'); // Redirect to role selection on sign out
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
