/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Firebase Core Imports
import { onSchedule } from "firebase-functions/v2/scheduler"; // V2 scheduler
import { getFirestore } from "firebase-admin/firestore";    // Firestore Admin SDK
import { initializeApp } from "firebase-admin/app";         // Admin SDK initialization

// Date Handling Imports
import { format } from "date-fns";        // Date formatting
import { utcToZonedTime } from "date-fns-tz"; // Timezone handling

// Initialize Firebase Admin SDK ONCE at the top level
initializeApp();

// Configuration Constants
const TARGET_TIMEZONE = "Etc/GMT"; // Use GMT/UTC for daily rollover to avoid DST issues

/**
 * Scheduled Cloud Function to update the /meta/current document daily.
 * This function runs shortly after midnight GMT, calculates tomorrow's date,
 * finds the corresponding puzzle number, checks if the next puzzle document exists,
 * and updates the pointer if the next puzzle is ready.
 */
export const updateDailyPuzzlePointer = onSchedule({
    // Function Configuration Options
    schedule: "5 0 * * *", // Every day at 00:05 GMT (slightly offset for safety)
    timeZone: TARGET_TIMEZONE, // Ensure schedule uses GMT
    retryCount: 3, // Automatically retry up to 3 times on failure
    region: "us-central1", // Specify the region for the function execution
  },
  // Async handler function - REMOVED the unused 'event' parameter
  async () => {
    console.log("Starting daily puzzle pointer update function."); // Log start

    const db = getFirestore(); // Get Firestore instance
    const metaRef = db.collection("meta").doc("current"); // Reference to the pointer document

    try {
      // 1. Calculate Tomorrow's Date (in GMT)
      const now = new Date(); // Current time
      const zonedNow = utcToZonedTime(now, TARGET_TIMEZONE); // Ensure we're operating in GMT
      const tomorrow = new Date(zonedNow);
      tomorrow.setDate(zonedNow.getDate() + 1); // Increment day by 1
      const nextPuzzleId = format(tomorrow, "yyyy-MM-dd"); // Format as YYYY-MM-DD

      console.log(`Calculated next puzzle ID target: ${nextPuzzleId}`);

      // 2. Get Current Metadata to Calculate Next Puzzle Number
      const currentMetaDoc = await metaRef.get();
      if (!currentMetaDoc.exists) {
        // This is a critical setup error, retrying won't help.
        console.error("CRITICAL FAILURE: /meta/current document not found! Manual intervention required.");
        // Consider adding alerting here for production environments.
        return; // Exit gracefully without throwing to prevent retries for this specific case.
      }

      const currentMeta = currentMetaDoc.data();
      // Safely access puzzleNumber, defaulting to 0 if missing or invalid.
      const currentPuzzleNumber = typeof currentMeta?.puzzleNumber === 'number' ? currentMeta.puzzleNumber : 0;
      const nextPuzzleNumber = currentPuzzleNumber + 1;

      console.log(`Current puzzle number: ${currentPuzzleNumber}, next puzzle number: ${nextPuzzleNumber}`);

      // 3. Check if Tomorrow's Puzzle Document Exists (Recommended Safeguard)
      const nextPuzzleDocRef = db.collection("puzzles").doc(nextPuzzleId);
      const nextPuzzleDoc = await nextPuzzleDocRef.get();

      if (!nextPuzzleDoc.exists) {
        // This might be normal if puzzles aren't uploaded far in advance.
        // Warn, but don't treat as a critical error unless it persists.
        console.warn(`Pointer update skipped: Puzzle document /puzzles/${nextPuzzleId} does not exist yet.`);
        // Consider alerting if this warning repeats for several days.
        return; // Exit gracefully, no update needed yet.
      }

      // 4. Update the Pointer Document
      await metaRef.update({
        activePuzzleId: nextPuzzleId,
        puzzleNumber: nextPuzzleNumber,
        // genesisDate is assumed to be static and remains unchanged
      });

      console.log(`SUCCESS: Updated /meta/current pointer to ID: ${nextPuzzleId}, Number: ${nextPuzzleNumber}`);
      return; // Signal successful completion

    } catch (error) {
      // Catch any unexpected errors during Firestore operations or calculations
      console.error("FAILURE: Failed to update puzzle pointer during execution.", error);
      // CRITICAL: Add more robust error reporting/alerting here for production.
      // Re-throw the error to signal failure to the Cloud Functions runtime,
      // which will trigger the configured retries (`retryCount: 3`).
      throw error;
    }
});