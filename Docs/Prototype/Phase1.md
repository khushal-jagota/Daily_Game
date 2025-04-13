# Prototype Implementation: Phase 1 - Setup and Static Rendering

**Goal:** Set up the project, copy necessary files, define initial data, and render the static crossword grid structure using the `useGameStateManager` hook.

---

### Step 0.1: Initialize Project

*   **Implementation:** Use Vite (or your preferred tool) to create a new React project with TypeScript. Example: `npm create vite@latest prototype-themed-crossword --template react-ts`. Navigate into the project directory (`cd prototype-themed-crossword`).
*   **Test:** Run `npm install` and `npm run dev`. Ensure the default React template runs in your browser.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    Completed and working
---

### Step 0.2: Install Dependencies

*   **Implementation:** Based on the old code's dependencies (`CrosswordProvider` uses `immer`, `styled-components`, `prop-types`), install them: `npm install immer styled-components prop-types`. Also install types for styled-components: `npm install -D @types/styled-components @types/prop-types`.
*   **Test:** `npm run dev` should still work without errors.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Functional
    ```

---

### Step 0.3: Create Directory Structure

*   **Implementation:** Manually create the core directories outlined in the prototype plan within your `src` folder:
    *   `src/Crossword/components/CrosswordCore`
    *   `src/Crossword/types`
    *   `src/Crossword/styles`
    *   `src/GameFlow/state`
    *   `src/Puzzle/data`
    *   `src/lib` (if not already present)
*   **Test:** Verify the directory structure exists in your file explorer.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    All directories successfully created and verified in the file system.
    ```

---

### Step 0.4: Copy Old Code Files

*   **Implementation:** Copy the specific files from the old project into the newly created directories:
    *   `CrosswordProvider.tsx` -> `src/Crossword/components/CrosswordCore/`
    *   `CrosswordGrid.tsx` -> `src/Crossword/components/CrosswordCore/`
    *   `Cell.tsx` -> `src/Crossword/components/CrosswordCore/`
    *   `context.ts` -> `src/Crossword/components/CrosswordCore/`
    *   `types.ts` -> `src/Crossword/types/index.ts` (*Rename to index.ts for cleaner imports*)
    *   `util.ts` -> `src/Crossword/components/CrosswordCore/`
    *   *(Optional)* `CrosswordStyles.ts` -> `src/Crossword/styles/`
*   **Test:** Check for any immediate import errors in your IDE. Adjust relative paths (`../types` might become `../../types` etc.) within the copied files. Run `npm run dev` – fix basic path errors until major path issues are resolved (full compilation might still fail).
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    All files have been successfully copied. Fixed import paths in all files to use '../../types' instead of './types'.

    Also moved CrosswordStyles.ts from CrosswordCore to src/Crossword/styles/ and created an index.ts file there to export all styles for easier imports.

    There are some TypeScript/linter errors that will need to be addressed in subsequent steps, but the major path issues are resolved.
    ```

---

### Step 1.1: Define Puzzle Data

*   **Implementation:** Create `src/Puzzle/data/themedPuzzles.ts`. Define and export a simple JavaScript object variable (e.g., `const prototypePuzzle`) conforming to the `CluesInput` type defined in `src/Crossword/types/index.ts`. Use a small 3x3 or 4x4 grid with 1-2 simple words across and down. Include `clue`, `answer`, `row`, `col` for each.
*   **Test:** Ensure the file is saved and there are no syntax errors.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 1.2: Basic `useGameStateManager` Hook (Data Holder)

*   **Implementation:**
    1.  Create the file `src/GameFlow/state/useGameStateManager.ts`. **<-- Updated Filename**
    2.  Define and export a custom hook function named `useGameStateManager` from this file (`export function useGameStateManager() { ... }`). This function will encapsulate our game's state logic.
    3.  Inside the `useGameStateManager` hook, import the `prototypePuzzle` data from `src/Puzzle/data/themedPuzzles.ts`.
    4.  Use React's `useState` hook to initialize and hold the imported `prototypePuzzle` data. This integrates the data into React's state management system.
    5.  Also using `useState`, initialize an empty object `{}` to eventually hold the state for `completedWords`. This prepares for future steps but won't be used immediately.
    6.  For this phase, ensure the `useGameStateManager` hook returns an object containing *only* the `puzzleData` state value. Other state (like `completedWords`) should be initialized but not yet returned.
*   **Test:**
    1.  In the `src/App.tsx` functional component, import the hook: `import { useGameStateManager } from './GameFlow/state/useGameStateManager';`. **<-- Updated Import Path**
    2.  *Call* the `useGameStateManager` hook near the top of the component body (`const { puzzleData } = useGameStateManager();`). **<-- Emphasize calling the hook**
    3.  Use `console.log` within the `App` component to output the `puzzleData` received from the hook.
    4.  Run the application (`npm run dev`).
    5.  Check the browser's developer console to verify that the structure and content of `prototypePuzzle` are logged correctly.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Using a custom hook (`useGameStateManager`) establishes the reactive foundation needed for later phases. Only puzzleData is exposed initially to keep Phase 1 focused.
    ```

---

### Step 1.3: Initial `CrosswordProvider` Render

*   **Implementation:** In `src/App.tsx`:
    *   *Call* the `useGameStateManager` hook to get the game state: `const { puzzleData } = useGameStateManager();`. **<-- Updated: Call hook**
    *   Import `CrosswordProvider` from `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`.
    *   Import and wrap with a basic `ThemeProvider` from `styled-components` (`<ThemeProvider theme={{}}>...</ThemeProvider>`).
    *   Render `<CrosswordProvider data={puzzleData} useStorage={false}><div>Loading Grid...</div></CrosswordProvider>`. **<-- Updated: Use puzzleData from hook**
*   **Test:** Run the app. Check the browser's React DevTools. Verify `CrosswordProvider` renders without crashing and its `data` prop matches your puzzle. Check the console for errors. You should see "Loading Grid..." on the page.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 1.4: Render `CrosswordGrid`

*   **Implementation:** Replace the `<div>Loading Grid...</div>` inside `CrosswordProvider` in `App.tsx` with `<CrosswordGrid />` (imported from `src/Crossword/components/CrosswordCore/CrosswordGrid.tsx`).
*   **Test:** Run the app. You should now see the SVG structure of your crossword grid rendered based on your hardcoded puzzle data. Interaction won't work properly yet.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---