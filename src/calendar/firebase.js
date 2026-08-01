import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Replace these values with your Firebase project config.
// Get it from: https://console.firebase.google.com
//   → Your project → Project Settings → Your apps → SDK setup
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
