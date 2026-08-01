import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCRkcWjl4ykMYLDOoIALOGuo4hp3NIxZZ4",
  authDomain: "nabil-calendar.firebaseapp.com",
  projectId: "nabil-calendar",
  storageBucket: "nabil-calendar.firebasestorage.app",
  messagingSenderId: "764822014079",
  appId: "1:764822014079:web:465f8b03a02781bc12574a",
  measurementId: "G-CF4N1ZRF6E",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
