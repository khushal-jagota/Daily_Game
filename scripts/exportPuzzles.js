// Script to export all puzzles from Firebase Firestore to a JSON file
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the Firebase configuration from environment variables with VITE_ prefix - exactly like the main app
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Log the Firebase configuration for debugging (without sensitive info)
console.log('Using Firebase project:', process.env.VITE_FIREBASE_PROJECT_ID);

async function exportPuzzles() {
  try {
    console.log('Fetching puzzles from Firebase...');
    
    // First, get the metadata to include in the export
    const metaRef = collection(db, 'meta');
    const metaSnapshot = await getDocs(metaRef);
    const metaData = {};
    
    metaSnapshot.forEach((doc) => {
      metaData[doc.id] = doc.data();
    });
    
    console.log(`Retrieved ${Object.keys(metaData).length} meta documents`);
    
    // Then get all puzzles
    const puzzlesRef = collection(db, 'puzzles');
    const puzzleSnapshot = await getDocs(puzzlesRef);
    const puzzles = {};
    
    // Process each puzzle and add it to the puzzles object
    puzzleSnapshot.forEach((doc) => {
      puzzles[doc.id] = doc.data();
    });
    
    console.log(`Retrieved ${Object.keys(puzzles).length} puzzle documents`);
    
    // Combine everything into a single export object
    const exportData = {
      meta: metaData,
      puzzles: puzzles
    };
    
    // Create the output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // Write to a JSON file
    const outputFile = path.join(outputDir, 'puzzles_export.json');
    fs.writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
    
    console.log(`Successfully exported all data to ${outputFile}`);
    
  } catch (error) {
    console.error('Error exporting puzzles:', error);
    
    // Additional debug info for Firebase errors
    if (error.code) {
      console.error('Firebase error code:', error.code);
      
      if (error.code === 'permission-denied') {
        console.error('\nThis appears to be a Firebase security rules issue.');
        console.error('Your Firebase project may have rules that restrict access from Node.js environments.');
        console.error('Options to resolve this:');
        console.error('1. Check if your Firebase Rules allow read access for unauthenticated users');
        console.error('2. Update your Firebase Rules to allow read access for these collections');
        console.error('3. Make sure you\'re using the same Firebase project as your main app\n');
      }
    }
  }
}

// Run the export function
exportPuzzles()
  .then(() => {
    console.log('Export completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Export failed:', error);
    process.exit(1);
  }); 