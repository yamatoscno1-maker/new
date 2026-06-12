import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJ7RKgdxTxlGC5UZW40faIUPQsSy4eeV4",
  authDomain: "satuei-kanri.firebaseapp.com",
  projectId: "satuei-kanri",
  storageBucket: "satuei-kanri.firebasestorage.app",
  messagingSenderId: "866108220373",
  appId: "1:866108220373:web:e584000f21a60dcd06935c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
