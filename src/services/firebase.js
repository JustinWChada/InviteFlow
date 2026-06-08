// src/services/firebase.js

import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCgksnN0sCEgsbSNOkNDKN2qvr61XKCTkE",
  authDomain: "inviteflow-796b5.firebaseapp.com",
  projectId: "inviteflow-796b5",
  storageBucket: "inviteflow-796b5.appspot.com",
  // Correct storage bucket: use the .appspot.com domain
  // If your Firebase console shows a different bucket name, replace this value.
  messagingSenderId: "49475640006",
  appId: "1:49475640006:web:be2070ca256071fcea15c7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);

export default app;