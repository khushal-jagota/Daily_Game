# REVISED Detailed Implementation Plan: Phase N+1 - Daily Puzzle & Firebase Integration

**Overall Goal:** Transition the game from static data (`src/Puzzle/data/themedPuzzles.ts`) to loading a daily puzzle from Firebase Firestore, incorporating an enriched server-side pointer, pre-caching, defined loading/error handling UX, and ensuring integration with the existing `useGameStateManager`.

---

## Step 1: Initial Firebase Setup & Seed Data (Enriched Pointer)

*   **Goal:** Establish the basic Firebase project structure, configure initial security, and populate it with minimal data (including the enriched pointer) for testing.
*   **Rationale:** Provides the necessary backend infrastructure and initial content to enable client-side fetching development. Setting security rules early is crucial, and using the enriched pointer structure simplifies client logic.
*   **Implementation Steps:**
    1.  Create the **development** Firebase project (e.g., `themed-crossword-dev`) via the Firebase console.
    2.  Enable the Firestore database within the project.
    3.  Navigate to Firestore -> Rules. Implement basic security rules:
        ```json
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow public read access to puzzles and the meta pointer
            match /puzzles/{puzzleId} {
              allow read: if true;
              allow write: if false; // Block all client writes
            }
            match /meta/current {
              allow read: if true;
              allow write: if false; // Block all client writes
            }
            // Cloud Function writes via Admin SDK bypass these rules.
            // Production write access is controlled by IAM.
          }
        }
        ```
    4.  Publish the rules.
    5.  Manually create the `/meta/current` document:
        *   Collection ID: `meta`
        *   Document ID: `current`
        *   Field: `activePuzzleId` (String) = `YYYY-MM-DD-TEST1` (Use a specific test date string, e.g., "2024-08-01")
        *   Field: `puzzleNumber` (Number) = `1`
        *   Field: `genesisDate` (String) = `YYYY-MM-DD-TEST1` (Same as `activePuzzleId` for the first puzzle)
    6.  Manually create two puzzle documents in the `puzzles` collection:
        *   Document ID: `YYYY-MM-DD-TEST1`
            *   Field: `puzzleData` (Map) = `{ across: { '1': { clue: '...', answer: '...', row: 0, col: 0 }, ... }, down: { ... } }` (Define and use a **valid structure** expected by `useGameStateManager` - see Step 5)
            *   Field: `themeTitle` (String) = "Test Theme 1"
            *   Field: `themeDescription` (String) = "Desc for test 1"
        *   Document ID: `YYYY-MM-DD-TEST2` (Use date string for the day *after* TEST1, e.g., "2024-08-02")
            *   Field: `puzzleData` (Map) = `{ ... }` (Valid structure)
            *   Field: `themeTitle` (String) = "Test Theme 2"
            *   Field: `themeDescription` (String) = "Desc for test 2"
*   **Testing:**
    *   Verify the Firestore database is accessible in the console.
    *   Confirm the security rules are published.
    *   Confirm the `/meta/current` document exists with the correct fields (`activePuzzleId`, `puzzleNumber`, `genesisDate`).
    *   Confirm the two test puzzle documents exist in the `puzzles` collection with the correct IDs and fields, ensuring `puzzleData` matches the *expected* structure.
*   **Implementation Notes:**
    *   *(Developer to fill in: Confirm the exact structure for `puzzleData` map needed by `useGameStateManager`)*

---

## Step 2: Create `PuzzleProvider` & Fetch Enriched Pointer

*   **Goal:** Set up the dedicated context/hook for puzzle loading and successfully fetch the enriched pointer data (`activePuzzleId`, `puzzleNumber`, `genesisDate`) from the `/meta/current` document.
*   **Rationale:** Encapsulates fetching logic early, establishing the foundation for data loading. Fetching the pointer is the first network request needed and provides essential context.
*   **Implementation Steps:**
    1.  Install Firebase SDK if not already present: `npm install firebase`
    2.  Create Firebase initialization file (`src/Integration/Firebase/firebase.ts`) - initially hardcode dev config keys, but **use `VITE_` prefixed keys from the start** ready for environment variables later.
    3.  Create the `PuzzleProvider` component / `usePuzzleLoader` hook (`src/Puzzle/PuzzleProvider.tsx` or similar).
    4.  Define initial state within the provider/hook: `loadingState: 'idle'`, `currentPuzzleMeta: null`, `currentPuzzleData: null`, `nextPuzzleData: null`, `error: null`. The `currentPuzzleMeta` will hold `{ activePuzzleId, puzzleNumber, genesisDate }`.
    5.  Implement a `fetchPuzzlePointer` function (or similar name, possibly part of a larger fetch function) within the provider/hook.
    6.  In the triggering effect/function, set `loadingState = 'loading'`.
    7.  Use Firestore SDK (`getDoc`, `doc`) to fetch the `/meta/current` document.
    8.  On successful fetch, extract `activePuzzleId`, `puzzleNumber`, `genesisDate`. Store these in the `currentPuzzleMeta` state. Log these values to the console.
    9.  Handle potential errors during fetch (set `loadingState = 'error'`, store error details, log to console for now).
    10. Add a `useEffect` hook (or equivalent trigger) to call the fetch logic on mount/initialization.
    11. Wrap the main application layout (likely in `src/App.tsx`) with the new `PuzzleProvider`.
*   **Testing:**
    *   Run the application.
    *   Check the browser console: Verify the correct `activePuzzleId`, `puzzleNumber`, and `genesisDate` are logged.
    *   Verify `loadingState` transitions `idle` -> `loading` initially.
    *   Verify no fatal errors occur during the fetch attempt.
    *   Simulate network error (DevTools) and verify `loadingState` becomes `'error'` and `error` state is populated.
*   **Implementation Notes:**
    *   *(Developer to fill in)*

---

## Step 3: Fetch Current Puzzle Based on Pointer

*   **Goal:** Use the fetched `activePuzzleId` to retrieve the corresponding puzzle document from the `puzzles` collection.
*   **Rationale:** Completes the primary data fetching path required to display the current day's puzzle.
*   **Implementation Steps:**
    1.  Modify the fetching logic in `PuzzleProvider`/`usePuzzleLoader`.
    2.  After successfully fetching `/meta/current` and storing `currentPuzzleMeta`:
        *   Use `currentPuzzleMeta.activePuzzleId` to construct the path to the puzzle document (e.g., `/puzzles/{activePuzzleId}`).
        *   Use `getDoc` to fetch this puzzle document.
    3.  On successful fetch:
        *   Validate `docSnap.exists()`.
        *   Validate `docSnap.data()` contains expected fields (`puzzleData`, `themeTitle`, `themeDescription`). **Crucially, validate the structure of `puzzleData` here.**
        *   Store the validated *full* puzzle document data in the `currentPuzzleData` state variable.
        *   Set `loadingState = 'success'`.
    4.  Handle errors: If `docSnap.exists()` is false or validation fails, or if the fetch itself fails, set `loadingState = 'error'`, store a specific error message in the `error` state variable, and log the detailed error.
*   **Testing:**
    *   Run the application.
    *   Use React DevTools or console logs within the provider to verify:
        *   The `loadingState` transitions `idle` -> `loading` -> `success` (or `error`).
        *   If successful, the `currentPuzzleMeta` state holds the pointer data, and `currentPuzzleData` state holds the full puzzle data (including `puzzleData`, `themeTitle`, etc.) matching `/puzzles/YYYY-MM-DD-TEST1`.
        *   Manually change `activePuzzleId` in Firestore to a non-existent ID, verify the `loadingState` becomes `'error'` and the `error` state reflects "Puzzle data not found" or similar.
        *   Test with malformed data in the puzzle document (if possible) to verify validation catches it.
*   **Implementation Notes:**
    *   *(Developer to fill in)*

---

## Step 4: Basic Render Pass (Title & Puzzle Number Display)

*   **Goal:** Pass the fetched puzzle metadata and theme title to the game screen and display them to confirm data flow.
*   **Rationale:** Verifies the connection between the data fetching layer (`PuzzleProvider`) and the UI presentation layer before wiring up the complex grid. Uses the new pointer data.
*   **Implementation Steps:**
    1.  Ensure `PuzzleProvider` exposes `{ loadingState, currentPuzzleMeta, currentPuzzleData, error }`.
    2.  Modify `App.tsx` (or relevant routing/screen logic):
        *   Consume the state from `usePuzzleLoader`.
        *   Conditionally render based on `loadingState` (handle loading/error states later in Steps 6 & 7).
        *   When navigating/rendering the Game Screen, pass relevant data:
            *   `puzzleNumber` (from `currentPuzzleMeta`)
            *   `themeTitle`, `themeDescription` (from `currentPuzzleData`)
            *   `puzzleData` (from `currentPuzzleData`)
    3.  Modify the Game Screen component:
        *   Accept the props.
        *   Render the received `themeTitle` and `Puzzle #{puzzleNumber}` somewhere visible (e.g., in the header area).
*   **Testing:**
    *   Run the application and navigate to the game screen (once loading succeeds).
    *   Verify that the correct `themeTitle` ("Test Theme 1") and `Puzzle #1` fetched from Firestore are displayed.
    *   Manually update `/meta/current` to point to `YYYY-MM-DD-TEST2` and set `puzzleNumber` to `2`. Reload and verify "Test Theme 2" and "Puzzle #2" are displayed.
*   **Implementation Notes:**
    *   *(Developer to fill in)*

---

## Step 5: Render Grid with Fetched Data (CRITICAL INTEGRATION)

*   **Goal:** Initialize `useGameStateManager` with the fetched `puzzleData` and render the interactive crossword grid using `ThemedCrossword` / `CrosswordCore`.
*   **Rationale:** The core integration point for component reuse. Success here validates the strategy, while failure requires adaptation. **High Risk due to `CrosswordCore` limitations (no tests, external origin).**
*   **Implementation Steps:**
    1.  **(SUB-TASK - Pre-computation/Verification):**
        *   **Deeply analyze** the exact input data structure expected by `useGameStateManager` (in `src/GameFlow/state/useGameStateManager.ts`) for puzzle definition.
        *   **Compare** this required structure with the structure you defined and stored in Firestore's `puzzleData` field (Step 1 & 3).
        *   **Identify** any discrepancies (e.g., naming differences, nested structures, required fields).
    2.  **(SUB-TASK - Adaptation/Transformation):**
        *   **If discrepancies exist:** Decide *where* to perform the transformation.
            *   **Option A (Preferred if minor):** Transform the fetched `puzzleData` within the Game Screen component *before* passing it to `useGameStateManager`.
            *   **Option B (If major transformation needed):** Create a dedicated utility function (e.g., `src/Puzzle/utils/adaptPuzzleData.ts`) to handle the mapping.
            *   **Option C (Avoid if possible):** Modify `useGameStateManager` itself. This is risky as it might break existing functionality or assumptions (given lack of tests).
        *   **Implement** the chosen transformation logic.
    3.  Modify the Game Screen component:
        *   Initialize `useGameStateManager`, passing the **correctly structured/transformed** `puzzleData` object received from props/provider.
        *   Ensure `ThemedCrossword` (`src/Crossword/components/ThemedCrossword.tsx`) receives the necessary state and callbacks from `useGameStateManager`.
*   **Testing:**
    *   Run the application and navigate to the game screen.
    *   **Verify the crossword grid renders correctly** based on the structure defined in `/puzzles/YYYY-MM-DD-TEST1`. This is the key validation point.
    *   Perform **thorough manual interactions**: clicking cells, entering letters (via physical and virtual keyboards), checking clues, moving between cells. Ensure the core crossword functionality provided by `CrosswordCore` works flawlessly with the fetched and potentially transformed data.
    *   Test with the second puzzle (`YYYY-MM-DD-TEST2`) to ensure it also renders and functions correctly.
*   **Implementation Notes:**
    *   *(Developer to fill in: Document the exact required structure for `useGameStateManager` vs. Firestore structure, and the chosen transformation strategy if needed.)*

---


## Step 6 (REVISED): Implement Background Loading & Auto-Navigation

*   **Goal:** Modify the Landing Page logic so clicking "Start Game" either navigates immediately (if data is ready) or triggers automatic navigation once the `PuzzleProvider` successfully loads the data in the background.
*   **Rationale:** Implements the desired seamless loading experience without an explicit popup, relying on the `PuzzleProvider`'s state.
*   **Implementation Steps:**
    1.  Add local state to the Landing Page component: `hasInitiatedStart: boolean` (default `false`).
    2.  Consume `{ loadingState }` from `usePuzzleLoader` (via `PuzzleProvider`).
    3.  Modify the "Start Game" `onClick` handler:
        *   Set `hasInitiatedStart = true`.
        *   **Check the current `loadingState`:**
            *   If `loadingState === 'success'`, trigger navigation to the game screen immediately.
            *   If `loadingState === 'loading'`, do nothing else here; the `useEffect` below will handle it.
            *   If `loadingState === 'error'`, do nothing (button should be disabled - see Step 7).
        *   (Implement button disabling logic from Step 11 here as well to prevent rapid clicks).
    4.  Use a `useEffect` hook in the Landing Page that watches `loadingState` and `hasInitiatedStart`:
        *   Inside the effect, check: `if (loadingState === 'success' && hasInitiatedStart)`.
        *   If true:
            *   Trigger navigation to the game screen.
            *   Reset `hasInitiatedStart = false` (to prevent re-navigation if state somehow changes again).
*   **Testing:**
    *   Simulate a slow network connection (Browser DevTools).
    *   Run the application. Click "Start Game" *while* the network request is pending (`loadingState === 'loading'`).
    *   Verify no popup appears. Verify the user stays on the Landing Page.
    *   Verify that once the fetch completes (`loadingState` becomes `'success'`), navigation to the game screen occurs automatically.
    *   Verify that if the fetch is fast (`loadingState` is already `'success'` when clicked), navigation is immediate.
*   **Implementation Notes:**
    *   *(Developer to fill in: Ensure navigation logic is robust and state resets correctly.)*

---

## Step 7 (REVISED): Implement Minimal Error Handling (Disable Button)

*   **Goal:** Prevent the user from attempting to start the game if the puzzle data failed to load, by disabling the "Start Game" button.
*   **Rationale:** Provides minimal feedback for the error state without dedicated UI, fulfilling the request to remove the landing page error message for now. Acknowledges this as a simplified MVP approach.
*   **Implementation Steps:**
    1.  Consume `{ loadingState }` from `usePuzzleLoader` in the Landing Page component.
    2.  Modify the "Start Game" button element:
        *   Add the `disabled` attribute.
        *   Set its value based on the loading state: `disabled={loadingState === 'error' || isProcessingClick}` (where `isProcessingClick` comes from Step 11 logic).
*   **Testing:**
    *   Manually change the `activePuzzleId` in `/meta/current` to point to a non-existent document ID to force an error state. Run the app.
    *   Verify the "Start Game" button on the Landing Page is visibly disabled and cannot be clicked.
    *   Simulate a network error (e.g., disconnect Wi-Fi briefly during load). Verify the button becomes disabled once `loadingState` transitions to `'error'`.
    *   Restore the correct `activePuzzleId`/network, reload, and verify the button is enabled (once loading is idle or successful).
*   **Implementation Notes:**
    *   *(Developer to fill in: Confirm button styling clearly indicates the disabled state.)*
    *   **(Technical Debt Note):** This step intentionally omits user-facing error messages. Plan to add more informative error handling in a future iteration.

---

## Step 8 (REMOVED / COMPLETED)

*   **Status:** Completed/Removed. Puzzle number display confirmed working.

---

## Steps 9 & 10 (SKIPPED): Pre-caching and Local Storage

*   **Status:** Skipped for this phase.
*   **Rationale:** As requested, the implementation of next-day pre-caching fetch (Step 9) and associated `localStorage` logic (Step 10) will be deferred to a potential future phase to simplify the current MVP.

---

## Step 11: Implement "Disable on Click" UI Tweak

*   **Goal:** Prevent rapid/double clicks on the "Start Game" button causing issues.
*   **Rationale:** Minor UX refinement to avoid unintended multiple navigation attempts or state issues, integrated with revised Step 6/7 logic.
*   **Implementation Steps:**
    1.  Refine the Landing Page "Start Game" button logic:
        *   Use local state `isProcessingClick: boolean` (default `false`).
        *   In `onClick`:
            *   If `isProcessingClick` is true or `loadingState === 'error'`, return immediately.
            *   Set `isProcessingClick = true`.
            *   Proceed with the logic from Step 6 (`set hasInitiatedStart = true`, check `loadingState`, navigate if possible).
            *   Ensure the button's `disabled` attribute reflects this state: `disabled={loadingState === 'error' || isProcessingClick}`.
        *   Ensure `isProcessingClick` is reset to `false`:
            *   After navigation is successfully triggered (or determined not possible in the current click cycle). A `setTimeout` might be useful for brief visual feedback if the check is synchronous and doesn't immediately navigate or enter loading.
*   **Testing:**
    *   Run the application.
    *   Click the "Start Game" button rapidly. Verify only one action (navigation attempt or setting `hasInitiatedStart`) occurs per logical attempt.
    *   Verify the button visually appears disabled briefly during the click processing and permanently if `loadingState` is `'error'`.
*   **Implementation Notes:**
    *   *(Developer to fill in: Fine-tune the timing of resetting `isProcessingClick` for best UX.)*

---

## Step 12: Implement Cloud Function (Scheduled Pointer Update)

*   **Goal:** Automate the daily update of the `/meta/current` pointer document in Firestore to point to the next day's puzzle.
*   **Rationale:** Removes the need for manual daily updates, ensuring the "daily puzzle" feature works reliably. (Remains crucial even without client-side caching).
*   **Implementation Steps:**
    1.  Ensure Firebase CLI is installed (`npm install -g firebase-tools`) and configured (`firebase login`).
    2.  Initialize Firebase Functions in your project root: `firebase init functions` (choose TypeScript, use existing project). Install necessary dependencies (e.g., `firebase-admin`, `firebase-functions`, date library) inside the `functions` directory.
    3.  Replace the template code in `functions/src/index.ts` with the scheduled function:
        ```typescript
        import * as functions from "firebase-functions";
        import { getFirestore } from "firebase-admin/firestore";
        import { initializeApp } from "firebase-admin/app";
        import { format } from "date-fns"; // Or your chosen date library
        import { utcToZonedTime } from "date-fns-tz"; // To handle timezone correctly

        initializeApp(); // Initialize Firebase Admin SDK

        const TARGET_TIMEZONE = "Etc/GMT"; // Use GMT/UTC for daily rollover

        export const updateDailyPuzzlePointer = functions.pubsub
          // Schedule slightly after midnight GMT to avoid DST ambiguities if possible,
          // but 00:00 GMT is standard. Adjust if needed.
          .schedule("5 0 * * *") // Every day at 00:05 GMT
          .timeZone(TARGET_TIMEZONE)
          .onRun(async (context) => {
            const db = getFirestore();
            const metaRef = db.collection("meta").doc("current");

            try {
              // Get current date in GMT/UTC
              const now = new Date();
              const zonedNow = utcToZonedTime(now, TARGET_TIMEZONE);

              // Calculate TOMORROW's date string in YYYY-MM-DD format (relative to GMT)
              const tomorrow = new Date(zonedNow);
              tomorrow.setDate(zonedNow.getDate() + 1);
              const nextPuzzleId = format(tomorrow, "yyyy-MM-dd");

              // Get the current puzzle number to increment it
              const currentMetaDoc = await metaRef.get();
              if (!currentMetaDoc.exists) {
                console.error("CRITICAL: /meta/current document not found!");
                // Add alerting here in production
                return null;
              }
              const currentMeta = currentMetaDoc.data();
              const currentPuzzleNumber = currentMeta?.puzzleNumber || 0; // Default to 0 if missing
              const nextPuzzleNumber = currentPuzzleNumber + 1;

              // Check if the puzzle doc for tomorrow actually exists (optional but recommended)
              const nextPuzzleDocRef = db.collection("puzzles").doc(nextPuzzleId);
              const nextPuzzleDoc = await nextPuzzleDocRef.get();

              if (!nextPuzzleDoc.exists) {
                 console.warn(`Pointer update skipped: Puzzle document for ${nextPuzzleId} does not exist yet.`);
                 // Consider alerting if this persists
                 return null;
              }

              // Update the pointer document
              await metaRef.update({
                activePuzzleId: nextPuzzleId,
                puzzleNumber: nextPuzzleNumber,
                // genesisDate remains unchanged
              });
              console.log(`Successfully updated current puzzle pointer to ID: ${nextPuzzleId}, Number: ${nextPuzzleNumber}`);
              return null;

            } catch (error) {
              console.error("Failed to update puzzle pointer:", error);
              // CRITICAL: Add error reporting/alerting here for production
              return null;
            }
          });
        ```
    4.  Deploy the function: `firebase deploy --only functions`.
    5.  **(Documentation Task):** Document the service account used by this function (visible in Google Cloud Console -> IAM) and the necessary IAM roles it requires (e.g., `roles/datastore.user` which grants Firestore read/write). Note that Firestore Security Rules are bypassed by the Admin SDK.
*   **Testing:**
    *   Check Firebase console -> Functions. Verify deployment succeeded and check logs.
    *   Manually trigger the function via Google Cloud Console (Cloud Scheduler -> Find job -> Run now). Check logs for correct date calculation (`nextPuzzleId`), number increment (`nextPuzzleNumber`), and Firestore update attempt. Check if the optional existence check works.
    *   Verify the `/meta/current` document in Firestore is updated correctly after manual trigger (assuming the next day's puzzle doc exists).
    *   Test date logic edge cases (month/year rollovers) by temporarily changing the system clock or modifying the function's date calculation for testing purposes.
    *   Monitor logs around the scheduled time (00:05 GMT) to ensure automatic execution.
*   **Implementation Notes:**
    *   *(Developer to fill in: Confirm date library usage, add production alerting placeholders.)*
    *   *(Future Enhancement: Implement robust alerting for function failures.)*

---

## Step 13: Finalize Environment Setup [PRE-LAUNCH]

*   **Goal:** Create the production Firebase project and configure environment variables for safe deployment.
*   **Rationale:** Mandatory separation of development and production environments.
*   **Implementation Steps:**
    1.  Create the **production** Firebase project (e.g., `themed-crossword-prod`).
    2.  Enable Firestore in the production project. Set the correct region.
    3.  Deploy the same Firestore security rules (Step 1) to the production project.
    4.  Deploy the finalized Cloud Function (Step 12) to the production project. Ensure its service account has correct IAM roles in the *production* GCP project.
    5.  Manually create the `/meta/current` document in the **production** Firestore, pointing it to the *actual first day's puzzle ID* and setting `puzzleNumber: 1` and the correct `genesisDate`.
    6.  Upload the initial batch of finalized puzzle documents (`puzzleData` structure must be correct!) to the **production** `puzzles` collection. Ensure filenames match the `YYYY-MM-DD` format.
    7.  Retrieve the Firebase configuration keys/object for **both** dev and prod projects from the Firebase console (Project Settings -> General -> Your apps -> Web app -> SDK setup and configuration).
    8.  Configure environment variables in your deployment host (e.g., Vercel):
        *   Set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc., for the **Production** environment using **prod** keys.
        *   Set `VITE_FIREBASE_API_KEY`, etc., for **Preview/Development** environments using **dev** keys.
    9.  Ensure your local `.env` file (and `.env.development` if used) contains the **dev** keys. Add `.env*` to `.gitignore`.
    10. Double-check the Firebase initialization code (`src/Integration/Firebase/firebase.ts`) correctly reads from `import.meta.env.VITE_...` variables and initializes Firebase only once.
*   **Testing:**
    *   Run the app locally (`npm run dev`) - verify it connects to the **dev** Firebase project (check Firestore usage in console, or logs).
    *   Deploy a preview branch to Vercel - verify it connects to the **dev** Firebase project using Vercel's environment variables.
    *   Trigger a production deployment (e.g., merge to `main`) - verify the deployed site connects to the **prod** Firebase project.
*   **Implementation Notes:**
    *   *(Developer to fill in)*

---

## Step 14: Final Manual Testing & Deployment [PRE-LAUNCH]

*   **Goal:** Perform final end-to-end checks before releasing the daily puzzle feature.
*   **Rationale:** Final verification sweep to catch any remaining issues.
*   **Implementation Steps:**
    1.  Perform thorough manual testing on a Vercel preview deployment (connected to dev Firebase). Cover all key user flows implemented in this phase:
        *   First load (network fetch).
        *   Loading behavior (no popup, auto-navigate on success).
        *   Error state (button disabled).
        *   Core gameplay with fetched data (using `useGameStateManager`/`CrosswordCore`).
        *   Puzzle number and theme display.
        *   Interaction with existing features (virtual keyboard, timer, share modal - ensure no regressions).
        *   Button click disabling (Step 11).
    2.  Perform smoke testing on the production deployment URL (connected to prod Firebase):
        *   Load the app. Verify the correct production puzzle for the launch day loads.
        *   Start the game, interact briefly. Verify button disabling on error/click works.
    3.  Monitor Firestore reads/writes and Cloud Function executions/logs immediately after launch.
*   **Testing:**
    *   Execute a pre-defined manual test plan covering all functional requirements (FR1-FR5 adapted for simplified loading/error) and non-functional aspects addressed in this plan.
    *   Verify production deployment loads the correct puzzle intended for the launch day.
*   **Implementation Notes:**
    *   *(Developer to fill in)*

---