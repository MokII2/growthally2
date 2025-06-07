
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  role: 'parent' | 'child';
  email?: string; // For both, but primary for parent
  displayName?: string; // Primarily for children, or as a fallback for parent's name
  name?: string; // Parent's full name
  gender?: 'male' | 'female' | 'other' | ''; // Parent's gender
  age?: number; // Parent's age
  phone?: string; // Parent's phone number
  parentId?: string; // For children, linking to parent's UID
  points?: number; // For children
}

export interface Child { // This type is for the subcollection under parent
  id: string; // Firestore document ID
  name: string;
  email: string; // Child's email, used for potential future direct login
  points: number;
  // authUid?: string; // Optional: Firebase Auth UID if child has direct login
}

export interface Task {
  id: string; // Firestore document ID
  description: string;
  points: number;
  assignedTo?: string; // Child's main user UID (from /users/{childAuthUid})
  assignedToName?: string; // Denormalized child's name
  status: 'pending' | 'completed' | 'verified';
  parentId: string; // Parent's authUid
  createdAt: any; // Firebase Timestamp placeholder for serverTimestamp()
}

export interface Reward {
  id: string; // Firestore document ID
  description: string;
  pointsCost: number;
  parentId: string; // Parent's authUid
  createdAt: any; // Firebase Timestamp placeholder
}

// Context state type
export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isParent: boolean;
  isChild: boolean;
  signUpParent: (details: Omit<UserProfile, 'uid' | 'role' | 'points' | 'parentId'> & {password: string}) => Promise<FirebaseUser | null>;
  signInParentWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signInChildWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>; // Assumes child has direct auth
  signUpChildAndLinkToParent: (parentAuthUid: string, childDetails: { name: string, email: string, password?: string }) => Promise<UserProfile | null>; // Creates child record and potentially child auth user
  signOutUser: () => Promise<void>;
  fetchUserProfile: (uid: string) => Promise<UserProfile | null>;
}
