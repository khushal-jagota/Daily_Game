// upload.js

const fs    = require('fs');
const path  = require('path');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin SDK
//    Make sure serviceAccountKey.json is in the same folder as this script.
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (err) {
  console.error('❌ Failed to load serviceAccountKey.json. Make sure it exists in this folder.');
  process.exit(1);
}

const db = admin.firestore();

// 2. Define your puzzles folder
const PUZZLE_DIR = path.join(__dirname, 'puzzles');

// 3. Verify puzzles folder exists
if (!fs.existsSync(PUZZLE_DIR)) {
  console.error(`❌ puzzles directory not found at ${PUZZLE_DIR}`);
  process.exit(1);
}

// 4. Read and upload
fs.readdirSync(PUZZLE_DIR)
  .filter(file => file.endsWith('.json'))
  .forEach(file => {
    const puzzleId = path.basename(file, '.json'); // e.g. "2025-04-26-TEST1"
    const fullPath = path.join(PUZZLE_DIR, file);

    // 4a. Load and validate JSON
    let data;
    try {
      data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (err) {
      console.error(`❌ Invalid JSON in ${file}:`, err.message);
      return;
    }

    // 4b. Basic structure check
    const hasKeys = ['themeTitle','themeDescription','puzzleData']
      .every(k => k in data);
    if (!hasKeys) {
      console.error(`❌ ${file} is missing one of [themeTitle, themeDescription, puzzleData]`);
      return;
    }
    if (typeof data.puzzleData !== 'object' ||
        !data.puzzleData.across ||
        !data.puzzleData.down) {
      console.error(`❌ ${file} puzzleData must include both "across" and "down" maps`);
      return;
    }

    // 4c. Upload to Firestore
    db.collection('puzzles')
      .doc(puzzleId)
      .set(data)
      .then(() => console.log(`✅ Uploaded ${puzzleId}`))
      .catch(err => console.error(`❌ Error uploading ${puzzleId}:`, err.message));
  });