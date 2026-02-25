import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
    getAuth,
    // @ts-ignore -- exported via react-native condition in @firebase/auth; TS can't resolve it
    getReactNativePersistence,
    initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCS7RD6vURsDY-lc78__hM_X-Asc5sdrdM",
  authDomain: "futco-c878e.firebaseapp.com",
  projectId: "futco-c878e",
  storageBucket: "futco-c878e.firebasestorage.app",
  messagingSenderId: "848208220248",
  appId: "1:848208220248:web:191ccf6e8daec0b6b73a2d",
  measurementId: "G-YPZFVK0XFT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use initializeAuth with AsyncStorage persistence on native platforms,
// and the default getAuth (which uses indexedDB/localStorage) on web.
export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
