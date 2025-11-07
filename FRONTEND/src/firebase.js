import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBaQtZXQ1vfqg-cVdpVxJXtSxU5Pijth9A",
  authDomain: "movie-app-1ad6b.firebaseapp.com",
  projectId: "movie-app-1ad6b",
  storageBucket: "movie-app-1ad6b.firebasestorage.app",
  messagingSenderId: "933547457178",
  appId: "1:933547457178:web:320a9e0b7a00f150da7d23"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };
