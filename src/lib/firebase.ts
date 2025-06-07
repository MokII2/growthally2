
import { initializeApp, getApps, getApp, deleteApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// IMPORTANT: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZbRwNNSfqIE8HgkmwxzsZbdhmKjbY0ko",
  authDomain: "growth-ally-nsxp1.firebaseapp.com",
  projectId: "growth-ally-nsxp1",
  storageBucket: "growth-ally-nsxp1.firebasestorage.app",
  messagingSenderId: "1078263027083",
  appId: "1:1078263027083:web:a7fe44abf892ec51bb4b8e",
};

const PRIMARY_APP_NAME = "PRIMARY";

let app: FirebaseApp; // This will be the primary app
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig, PRIMARY_APP_NAME);
} else {
  // Ensure primary app is fetched by its name if multiple apps might exist
  try {
    app = getApp(PRIMARY_APP_NAME);
  } catch (e) {
    // Fallback if named app doesn't exist but default does (less ideal, but defensive)
    app = getApp(); 
  }
}

const auth: Auth = getAuth(app); // Auth service from the primary app
const db: Firestore = getFirestore(app); // Firestore service from the primary app

// Function to create and manage a temporary secondary app for auth operations
export async function createTemporaryAuthInstance(): Promise<{ tempAuth: Auth; cleanup: () => Promise<void> }> {
  const appName = `secondary-auth-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  let tempApp: FirebaseApp;

  // Initialize if it doesn't exist (it shouldn't with a unique name)
  tempApp = initializeApp(firebaseConfig, appName);
  
  const tempAuth = getAuth(tempApp);

  const cleanup = async () => {
    try {
      await deleteApp(tempApp);
    } catch (error) {
      console.error(`Error deleting temporary Firebase app (${appName}):`, error);
    }
  };
  return { tempAuth, cleanup };
}

export { app, auth, db };
