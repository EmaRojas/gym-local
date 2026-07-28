import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCrEOdGHhi_fCGMPMgpxltPlErRzyzOPVE",
  authDomain: "gyum-e7454.firebaseapp.com",
  projectId: "gyum-e7454",
  storageBucket: "gyum-e7454.firebasestorage.app",
  messagingSenderId: "21940366601",
  appId: "1:21940366601:web:2e96950a991ed0bcb0b7d8"
}

const app = initializeApp(firebaseConfig)
const dbFirebase = getFirestore(app)

export default dbFirebase
