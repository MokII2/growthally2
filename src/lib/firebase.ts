import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// IMPORTANT: Replace these with your actual Firebase project configuration
// These should ideally be stored in environment variables (e.g., .env.local)
// For example, process.env.NEXT_PUBLIC_FIREBASE_API_KEY
const firebaseConfig = {
  apiKey: "AIzaSyBZbRwNNSfqIE8HgkmwxzsZbdhmKjbY0ko",
  authDomain: "growth-ally-nsxp1.firebaseapp.com",
  projectId: "growth-ally-nsxp1",
  storageBucket: "growth-ally-nsxp1.firebasestorage.app", // Reverted to user's original value
  messagingSenderId: "1078263027083",
  appId: "1:1078263027083:web:a7fe44abf892ec51bb4b8e",
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
