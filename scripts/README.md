# Firebase Puzzle Export Script

This script exports all puzzles and metadata from your Firebase Firestore database to a local JSON file.

## Setup

1. Navigate to the scripts directory:
   ```
   cd scripts
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Environment Variables
   
   The script uses the same VITE_ prefixed environment variables as your main project:
   
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_FIREBASE_MEASUREMENT_ID
   ```
   
   These should already be configured in your root `.env` file.

## Running the Script

You can run the script directly in your IDE or use one of these methods:

1. Using npm:
   ```
   npm run export
   ```

2. Using node directly:
   ```
   node exportPuzzles.js
   ```

## Troubleshooting

If you encounter Firebase permission issues, check:
1. Your Firebase security rules allow read access to the `meta` and `puzzles` collections
2. You're using the same Firebase project in your `.env` file as your main app
3. Your environment variables are correctly set

## Output

The script will:
1. Connect to your Firebase Firestore database
2. Export all documents from the `meta` collection
3. Export all documents from the `puzzles` collection
4. Write everything to `output/puzzles_export.json`

The exported JSON structure will be:

```json
{
  "meta": {
    "documentId1": { /* document data */ },
    "current": { /* document data */ },
    ...
  },
  "puzzles": {
    "puzzleId1": { /* puzzle data */ },
    "puzzleId2": { /* puzzle data */ },
    ...
  }
}
``` 