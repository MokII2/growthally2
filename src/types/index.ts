
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  role: 'parent' | 'child';
  email?: string;
  displayName?: string;
  name?: string;
  gender?: 'male' | 'female' | 'unspecified';
  age?: number;
  phone?: string;
  parentId?: string;
  points?: number;
  hobbies?: string[];
}

export interface Child {
  id: string;
  name: string;
  email: string;
  points: number;
  authUid?: string;
  initialPassword?: string;
  gender: 'male' | 'female';
  age: number;
  hobbies: string[];
  createdAt?: any;
}

export interface Task {
  id: string;
  description: string;
  points: number;
  assignedToUids: string[];
  assignedToNames: string[];
  status: 'pending' | 'completed' | 'verified';
  parentId: string;
  createdAt: any;
  completionNotes?: string;
  verificationFeedback?: string;
}

export interface Reward {
  id: string;
  description: string;
  pointsCost: number;
  parentId: string;
  createdAt: any;
}

export interface ClaimedReward {
  id: string; // Document ID of this claim record
  originalRewardId: string; // ID of the reward definition
  rewardDescription: string;
  pointsCost: number;
  claimedAt: any; // Firebase Timestamp
  parentId: string; // Parent who defined the original reward
  childUid: string; // UID of the child who claimed it
}

export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isParent: boolean;
  isChild: boolean;
  signUpParent: (details: Omit<UserProfile, 'uid' | 'role' | 'points' | 'parentId' | 'hobbies' | 'gender'> & { password: string; gender: 'male' | 'female' | 'unspecified' | undefined }) => Promise<FirebaseUser | null>;
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
  refreshUserProfile: () => Promise<void>;
}

export const HOBBY_OPTIONS = ["运动", "阅读", "音乐", "舞蹈", "计算", "手工", "烘培", "书法", "绘画", "编程"] as const;
export type Hobby = typeof HOBBY_OPTIONS[number];
