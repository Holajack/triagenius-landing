
// Firebase client configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8s-lR4oyDjJ00Swk1uacbw0XwtkzlJ5Q",
  authDomain: "the-triage-system-50cba.firebaseapp.com",
  projectId: "the-triage-system-50cba",
  storageBucket: "the-triage-system-50cba.firebasestorage.app",
  messagingSenderId: "564614501916",
  appId: "1:564614501916:web:fb0fc0bdb8b463189671d9",
  measurementId: "G-GDEDMXRD66"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
