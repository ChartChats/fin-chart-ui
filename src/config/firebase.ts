import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.GOOGLE_PUBLIC_AUTH_KEY,
  authDomain: process.env.GOOGLE_FIREBASE_AUTH_DOMAIN,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 