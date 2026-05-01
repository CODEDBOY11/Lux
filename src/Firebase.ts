// Firebase Authentication Setup
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLqNwnzLl9e7hj_K0qHGRpAXiefozF8Ak",
  authDomain: "luxstay-b6729.firebaseapp.com",
  projectId: "luxstay-b6729",
  storageBucket: "luxstay-b6729.firebasestorage.app",
  messagingSenderId: "672389019383",
  appId: "1:672389019383:web:25bbaa8fbf55c1b97e45f2",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google Sign-In
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Configure Apple Sign-In
export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
