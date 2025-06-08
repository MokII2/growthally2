
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  role: 'parent' | 'child';
  email?: string;
  displayName?: string;
  name?: string;
  gender?: 'male' | 'female' | ''; // Parent gender can be empty
  age?: number;
  phone?: string;
  parentId?: string;
  points?: number;
  hobbies?: string[]; // Added for child's main profile
}

export interface Child {
  id: string; // Document ID from the subcollection
  name: string;
  email: string;
  points: number;
  authUid?: string; // Firebase Auth UID if child has direct login
  initialPassword?: string; // For parent to see child's first password
  gender: 'male' | 'female'; // Child gender is required
  age: number; // Child age is required
  hobbies: string[]; // Child hobbies are required
  createdAt?: any;
}

export interface Task {
  id: string;
  description: string;
  points: number;
  assignedToUids: string[]; // Array of child UIDs
  assignedToNames: string[]; // Array of child names for display
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
  signUpParent: (details: Omit<UserProfile, 'uid' | 'role' | 'points' | 'parentId' | 'hobbies'> & {password: string}) => Promise<FirebaseUser | null>;
  signInParentWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signInChildWithEmail: (email: string, password: string) => Promise<FirebaseUser | null>;
  signUpChildAndLinkToParent: (
    parentAuthUid: string,
    childDetails: {
      name: string;
      emailPrefix: string;
      gender: 'male' | 'female';
      age: number;
      hobbies: string[];
    }
  ) => Promise<{ userProfile?: UserProfile; generatedPassword?: string; error?: { code?: string; message?: string } }>;
  signOutUser: () => Promise<void>;
  fetchUserProfile: (uid: string) => Promise<UserProfile | null>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  refreshUserProfile: () => Promise<void>; // Added for profile refresh
}

export const HOBBY_OPTIONS = ["运动", "阅读", "音乐", "舞蹈", "计算", "手工", "烘培", "书法", "绘画", "编程"] as const;
export type Hobby = typeof HOBBY_OPTIONS[number];
