// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBQQANZmbF1IvcTCe8E-jJXqtMvcxbnw24",
    authDomain: "cipher-gorth.firebaseapp.com",
    projectId: "cipher-gorth",
    storageBucket: "cipher-gorth.firebasestorage.app",
    messagingSenderId: "579906761509",
    appId: "1:579906761509:web:9cf2b0359013e5a13c20cc",
    measurementId: "G-N14CLPXSDY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);