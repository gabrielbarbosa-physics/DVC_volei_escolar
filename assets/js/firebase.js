/**
 * ============================================================================
 * Módulo: FIREBASE
 * ============================================================================
 * Responsabilidade: Gerencia funcionalidades relacionadas a firebase.
 * Este arquivo faz parte do sistema modular do DVC App.
 * Todos os códigos principais aqui agrupados seguem as diretrizes do projeto.
 * ============================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut, 
    setPersistence, 
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    arrayUnion, 
    increment,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDFDaMuKx5a1cAj1KAbnirGIeVZ44E6IkQ",
    authDomain: "dvc2-1d3cd.firebaseapp.com",
    projectId: "dvc2-1d3cd",
    storageBucket: "dvc2-1d3cd.firebasestorage.app",
    messagingSenderId: "768590711144",
    appId: "1:768590711144:web:65ae4dd795835e56b5aedd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Expose to window for backward compatibility
window.auth = auth;
window.db = db;
window.provider = provider;

window.collection = collection;
window.doc = doc;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.setDoc = setDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.addDoc = addDoc;
window.arrayUnion = arrayUnion;
window.increment = increment;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.limit = limit;
window.onSnapshot = onSnapshot;
window.serverTimestamp = serverTimestamp;
window.Timestamp = Timestamp;
window.writeBatch = writeBatch;

export {
    app,
    auth,
    db,
    provider,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    arrayUnion,
    increment,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    writeBatch
};
