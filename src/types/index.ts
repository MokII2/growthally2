
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  role: 'parent' | 'child';
  email?: string; 
  displayName?: string; 
  name?: string; 
  gender?: 'male' | 'female' | 'other' | ''; 
  age?: number; 
  phone?: string; 
  parentId?: string; 
  points?: number; 
}

export interface Child { 
  id: string; 
  name: string;
  email: string; 
  points: number;
  authUid?: string; // Firebase Auth UID if child has direct login
}

export interface Task {
  id: string; 
  description: string;
  points: number;
  assignedTo?: string; 
  assignedToName?: string; 
  status: 'pending' | 'completed' | 'verified';
  parentId: string; 
  createdAt: any; 
}

export interface Reward {
  id: string; 
  description: string;
  pointsCost: number;
  parentId: string; 
  createdAt: any; 
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
  signUpChildAndLinkToParent: (
    parentAuthUid: string, 
    childDetails: { name: string, email: string }
  ) => Promise<{ userProfile: UserProfile; generatedPassword?: string } | null>; // Return type updated
  signOutUser: () => Promise<void>;
  fetchUserProfile: (uid: string) => Promise<UserProfile | null>;
  sendPasswordReset: (email: string) => Promise<boolean>; // New method
}
