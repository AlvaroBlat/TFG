import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXkznFWUvMWubHpDYeBNePVWAT6z95sFY",
  authDomain: "proyecto-tfg-1865a.firebaseapp.com",
  projectId: "proyecto-tfg-1865a",
  storageBucket: "proyecto-tfg-1865a.firebasestorage.app",
  messagingSenderId: "403951365279",
  appId: "1:403951365279:web:cd700245009286b99546aa",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };
