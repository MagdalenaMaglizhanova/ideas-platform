import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyC2E5ouppqmvCY9zJRB4CvttwRVbHxLT5I",
  authDomain: "my-stem-app.firebaseapp.com",
  projectId: "my-stem-app",
  storageBucket: "my-stem-app.firebasestorage.app",
  messagingSenderId: "824457341128",
  appId: "1:824457341128:web:6080f7415babb9cec39dfd",
  measurementId: "G-5KNR2MFV72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);