
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  role: 'parent' | 'child';
  email?: string;
  displayName?: string; // For children or as a fallback for parent's name
  name?: string; // Parent's full name
  gender?: 'male' | 'female' | 'other' | ''; // Parent's gender
  age?: number; // Parent's age
  phone?: string; // Parent's phone number
  parentId?: string;
  points?: number;
}

export interface Child {
  id: string;
  name: string;
  email: string;
  points: number;
  authUid: string; // Firebase Auth UID of the child
}

export interface Task {
  id: string;
  description: string;
  points: number;
  assignedTo?: string; // Child's authUid
  assignedToName?: string;
  status: 'pending' | 'completed' | 'verified';
  parentId: string; // Parent's authUid
  createdAt: any; // Firebase Timestamp placeholder for serverTimestamp()
}

export interface Reward {
  id: string;
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
  signInChildWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signUpChildAndLinkToParent: (parentAuthUid: string, childDetails: { name: string, email: string, password?: string }) => Promise<UserProfile | null>;
  signOutUser: () => Promise<void>;
  fetchUserProfile: (uid: string) => Promise<UserProfile | null>;
}
