# Prototype Implementation: Phase 3 - Centralized Completion Logic & Visuals

**Goal:** Implement the logic *within `useGameStateManager`* for checking word correctness based on central guess state (`gridData`), managing the `completedWords` state, and passing completion information down to `Cell` components for visual styling (fixed color). Input blocking is assumed handled by Phase 2.5 logic.

**Prerequisite:** Phase 2.5 completed successfully. `useGameStateManager` owns focus/selection state AND `gridData` (guesses). All interaction logic (input, delete, move, validation) resides within the hook.

---

### Step 3.1: Add `completedWords` State to `useGameStateManager`

*   **Status:** Pending
*   **Scope:** Add the state variable to track which words are complete and map them to their completion info (initially just a fixed color).
*   **Reason:** To store the completion status centrally, which will drive visuals and potentially other logic later.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  Define a constant for the color: `const FIXED_COMPLETION_COLOR = '#cccccc';` (or similar).
    2.  Add a new state variable: `const [completedWords, setCompletedWords] = useState<Record<string, { color: string }>>({});`.
    3.  Ensure `completedWords` is included in the object returned by the hook.
*   **Test:** Static analysis. Verify state exists and is returned. Use React DevTools in later steps to monitor.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] State Returned by Hook
    *   [ ] Test Checked (Static)
*   **Notes:**
    ```text
    Establishing the central state store for word completion information.
    ```

---

### Step 3.2: Implement `checkWordCorrectness` Helper in `useGameStateManager`

*   **Status:** Pending
*   **Scope:** Create an internal helper function within the hook to determine if a specific word is currently correct based on the central guess state.
*   **Reason:** To encapsulate the correctness checking logic, making it reusable by actions.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  Define a new internal function `checkWordCorrectness(direction: Direction, number: string): boolean`.
    2.  Wrap it in `useCallback` with dependencies (`puzzleData`, `gridData`, `getCellData`).
    3.  **Inside `checkWordCorrectness`:**
        *   Look up the clue info (`row`, `col`, `answer`) from `puzzleData` using `direction` and `number`. Handle cases where the clue might not exist.
        *   Iterate from `i = 0` to `answer.length - 1`.
        *   For each letter index `i`, calculate the cell's `(r, c)` coordinates based on `direction`.
        *   Use `getCellData(r, c)` to get the cell's data from the hook's `gridData` state.
        *   Compare the `cell.guess` with the `answer[i]`.
        *   If any cell is not used, has no guess, or the guess doesn't match the answer character, return `false` immediately.
        *   If the loop completes without returning `false`, return `true`.
*   **Test:** Logic review. **Unit test this helper function thoroughly** with various scenarios (correct word, incorrect word, incomplete word, empty word). Mock dependencies (`puzzleData`, `getCellData`).
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Dependencies Verified (`useCallback`)
    *   [ ] Unit Test Written & Passed
    *   [ ] Test Checked (Review, Unit)
*   **Notes:**
    ```text
    Core logic for determining word correctness based on central state. Unit testing is important here.
    ```

---

### Step 3.3: Trigger Correctness Check & Update `completedWords` State

*   **Status:** Pending
*   **Scope:** Modify the hook's actions (primarily `handleGuessInput`, potentially `handleBackspace`/`handleDelete`) to call `checkWordCorrectness` after the guess state changes and update `completedWords` if a word becomes correct.
*   **Reason:** To dynamically update the completion status based on player input. Replaces the need for an external `onCorrect` callback.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  **Modify `handleGuessInput`:**
        *   *After* the `setGridData(...)` call that updates the guess, identify the word(s) the affected cell `(row, col)` belongs to (get `cellData.across`, `cellData.down`).
        *   For each valid word ID (`number-direction`) the cell belongs to:
            *   Call `const isCorrect = checkWordCorrectness(direction, number);`.
            *   If `isCorrect` is true:
                *   Construct the `wordId = \`${number}-${direction}\``.
                *   Call `setCompletedWords(prev => ({ ...prev, [wordId]: { color: FIXED_COMPLETION_COLOR } }));`.
    2.  **Modify `handleBackspace` / `handleDelete` (Optional but Recommended):**
        *   *After* the `setGridData(...)` call that clears the guess, identify the word(s) the affected cell belongs to.
        *   For each word ID:
            *   Check if this `wordId` currently exists in the `completedWords` state.
            *   If it does, remove it: `setCompletedWords(prev => { const newState = { ...prev }; delete newState[wordId]; return newState; });`.
    3.  Update `useCallback` dependencies for modified actions (add `checkWordCorrectness`, `setCompletedWords`, `completedWords`).
*   **Test:** Logic review. Add scenarios to unit tests for actions (verify `checkWordCorrectness` is called, mock `setCompletedWords` and verify it's called/not called correctly). Runtime testing via Step 3.4.
*   **Check:**
    *   [ ] `handleGuessInput` Modified
    *   [ ] `handleBackspace`/`handleDelete` Modified (Optional state clearing)
    *   [ ] Dependencies Updated
    *   [ ] Unit Test Scenarios Added & Passed
    *   [ ] Test Checked (Review, Unit)
*   **Notes:**
    ```text
    Integrating correctness checking into the input/delete flow within the hook. Hook now determines and updates completion status internally. Handling removal from completedWords on delete/backspace is important for UX.
    ```

---

### Step 3.4: Pass Completion Info Down & Update `Cell` Styling

*   **Status:** Pending
*   **Scope:** Calculate and pass down visual styling information based on `completedWords` state, and modify the `Cell` component to apply the styling.
*   **Reason:** To visually represent the completed words on the grid using the centrally managed state.
*   **Implementation:** *(Adapts logic from original Phase 3 plan)*
    1.  **In `ThemedCrossword.tsx` (Adapter):**
        *   Get `completedWords` and `puzzleData` from the `gameState` prop.
        *   Create `cellCompletionInfo` using `useMemo`: `const cellCompletionInfo = useMemo(() => { ... }, [completedWords, puzzleData]);`. Internal logic: iterate `completedWords`, look up clue geometry in `puzzleData`, map `cellKey` (e.g., `R${r}C${c}`) to `{ color }`.
        *   Pass `cellCompletionInfo` down to `<CrosswordProvider>` as a prop.
    2.  **Modify `CrosswordProvider.tsx`:**
        *   Add optional prop `cellCompletionInfo?: { [key: string]: { color: string } }`.
        *   Add `cellCompletionInfo` to the value provided by `CrosswordContext`. Update context `useMemo` dependencies.
    3.  **Modify `CrosswordGrid.tsx`:**
        *   Consume `cellCompletionInfo` from `CrosswordContext`.
        *   Inside the cell rendering loop, get `completionInfo = cellCompletionInfo?.[cellKey]`.
        *   Pass `completionInfo` prop down to `<Cell>`.
    4.  **Modify `Cell.tsx`:**
        *   Add optional prop `completionInfo?: { color: string }`.
        *   In the rendering logic for the background element (e.g., SVG `<rect>`), modify the `fill` attribute logic: Prioritize `completionInfo.color` if present, otherwise fall back to `focusBackground`, `highlightBackground`, or `cellBackground`. Example: `fill = props.completionInfo?.color ?? (props.focus ? focusBg : props.highlight ? highlightBg : cellBg);`
*   **Test:** **Runtime E2E Testing:**
    *   Run the app. Type the final correct letter of a word.
    *   Verify the `completedWords` state updates in the hook (DevTools).
    *   Verify the cells belonging *only* to that word change background color to `FIXED_COMPLETION_COLOR`.
    *   Verify focus/highlight styles still visually override the completion color when active.
    *   Complete intersecting words; verify shared cells correctly show completion color.
    *   Use Backspace/Delete on a completed word; verify color reverts & `completedWords` state updates (if implemented in 3.3).
    *   Re-test input blocking (Phase 2.5 logic): ensure typing is blocked in completed cells.
*   **Check:**
    *   [ ] `ThemedCrossword` Updated (`useMemo`, Prop Pass)
    *   [ ] `CrosswordProvider` Updated (Prop, Context)
    *   [ ] `CrosswordGrid` Updated (Context Consumption, Prop Pass)
    *   [ ] `Cell` Updated (Prop, Style Logic)
    *   [ ] Test Checked (Runtime E2E, Visuals, Interactions)
*   **Notes:**
    ```text
    Propagating completion visual state down. Requires modifying reused components. Styling logic in Cell needs careful implementation to handle precedence (completion vs focus/highlight). Testing visual state changes and interactions is key.
    ```

---

### Step 3.5: Update Phase Documentation

*   **Status:** Pending
*   **Scope:** Mark Phase 3 as complete, documenting the architecture.
*   **Reason:** Record progress.
*   **Implementation:** Update tracking documents (`Phase3.md`, etc.). Note that correctness checking and completion state are now fully centralized in `useGameStateManager`.
*   **Check:**
    *   [ ] Docs Updated
*   **Notes:**
    ```text
    Phase 3 complete. Centralized correctness checking and completion state management achieved. Visual feedback implemented.
    ```

---