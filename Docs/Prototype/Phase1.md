# Prototype Implementation: Phase 1 - Setup and Static Rendering

**Goal:** Set up the project, copy necessary files, define initial data, and render the static crossword grid structure.

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

### Step 1.2: Basic `GameStateManager` (Data Holder)

*   **Implementation:** Create `src/GameFlow/state/GameStateManager.ts`. Define a basic class or custom hook. Import `prototypePuzzle` from `themedPuzzles.ts`. Store this data in an internal variable/state. Initialize an empty `completedWords = {}`. Add a method `getPuzzleData()` that returns the stored puzzle data.
*   **Test:** In `src/App.tsx`, import and instantiate `GameStateManager`. Call `getPuzzleData()` and `console.log` the result. Run the app and check the browser console to verify the puzzle data is loaded correctly.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 1.3: Initial `CrosswordProvider` Render

*   **Implementation:** In `src/App.tsx`:
    *   Instantiate your basic `GameStateManager`.
    *   Import `CrosswordProvider` from `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`.
    *   Import and wrap with a basic `ThemeProvider` from `styled-components` (`<ThemeProvider theme={{}}>...</ThemeProvider>`).
    *   Render `<CrosswordProvider data={gameStateManager.getPuzzleData()} useStorage={false}><div>Loading Grid...</div></CrosswordProvider>`.
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