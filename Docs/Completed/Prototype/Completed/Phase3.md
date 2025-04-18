# Prototype Implementation: Phase 3 - Centralized Completion Logic & Visuals (Strict Locking - useEffect)

**Goal:** Implement the logic *within `useGameStateManager`* for checking word correctness, managing the `completedWords: Set<string>` state via a `useEffect` hook reacting to `gridData` changes, defining the completion color, and passing completion status down for visual styling. Implement **Strict Locking**: cells within completed words become uneditable.

**Prerequisite:** Phase 2.75 completed. `useGameStateManager` owns state. `getCellKey` exists. E2E tests passed. **Decision Made:** Implement Strict Locking model & `useEffect` for state synchronization. Final Styling Precedence: `Completion > Focus > Highlight > Default`.

---

### Step 3.1: Define Completion Color in Theme & Confirm State

*   **Status:** Completed
*   **Scope:** Define visual constant, update theme types, confirm `completedWords` state variable exists.
*   **Reason:** Centralize constants, ensure type safety, verify state structure.
*   **Implementation:** Theme (`CrosswordStyles.ts`), Type (`styled.d.ts`), State check (`useGameStateManager.ts`).
*   **Test:** Static analysis, code review.
*   **Check:**
    *   [x] Color Constant Added (`CrosswordStyles.ts`)
    *   [x] Theme Type Updated (`styled.d.ts`)
    *   [x] State Structure Confirmed (`useGameStateManager.ts`)
    *   [x] State Returned Confirmed
    *   [x] Test Checked (Static, Review)
*   **Notes:**
    ```text
    Added `completionBackground`. Updated `CrosswordTheme`. Confirmed `completedWords: Set<string>` state exists.
    ```

---

### Step 3.2: Implement `checkWordCorrectness` Helper in `useGameStateManager`

*   **Status:** Completed
*   **Scope:** Create internal helper for word correctness based on `gridData`.
*   **Reason:** Encapsulate correctness logic for reuse (especially by the new `useEffect`).
*   **Implementation:** Define `checkWordCorrectness` in `useGameStateManager.ts`, wrap in `useCallback`, handle cases (missing clue/answer, incomplete word, case-insensitive check).
*   **Test:** Logic review. Unit testing highly recommended.
*   **Check:**
    *   [x] Code Completed
    *   [x] Dependencies Verified
    *   [ ] Unit Test Written & Passed (Highly Recommended)
    *   [x] Test Checked (Review)
*   **Notes:**
    ```text
    Implemented `checkWordCorrectness` helper. Handles case-insensitive checks, incomplete words. Depends on `puzzleData`, `getCellKey`, `gridData`. Critical for the central `useEffect`.
    ```

---

### Step 3.3: Update `isEditableCell` & Simplify `handleGuessInput`

*   **Status:** Completed
*   **Scope:** Modify `isEditableCell` to implement strict locking (cell uneditable if *either* intersecting word is complete). Simplify `handleGuessInput` to *only* update `gridData` (if editable) and handle focus movement, removing direct completion checks.
*   **Reason:** Enforce strict locking rule. Prepare event handler for centralized completion management via `useEffect`.
*   **Implementation:**
    1.  **Update `isEditableCell`:** Modify to return `false` if `completedWords` contains *either* the across or down word ID for the cell.
    2.  **Simplify `handleGuessInput`:**
        *   Keep the `isEditableCell` check at the start.
        *   Inside `if (editable)` block: Only call `setGridData` to update the guess.
        *   **REMOVE** all logic that previously called `checkWordCorrectness` or `setCompletedWords`.
        *   Keep focus movement logic.
    3.  Update `useCallback` dependencies for `handleGuessInput` (remove completion-related ones).
*   **Test:** Logic review (focus on simplification). E2E test: Type into cell -> verify `gridData` updates. Type into completed cell -> verify blocked.
*   **Check:**
    *   [x] `isEditableCell` Updated for Strict Lock
    *   [x] `handleGuessInput` Simplified (Only sets gridData if editable)
    *   [x] Direct Completion Logic REMOVED from `handleGuessInput`
    *   [x] Dependencies Updated & Verified
    *   [ ] Unit Test Scenarios Updated (Recommended)
    *   [x] Test Checked (Review, E2E Input/Blocking)
*   **Notes:**
    ```text
    Updated `isEditableCell` for strict locking. Simplified `handleGuessInput` to only modify `gridData` (and move focus), deferring completion state updates to the central `useEffect`.
    ```

---

### Step 3.4: Simplify `handleBackspace`/`handleDelete` & Ensure Lock

*   **Status:** Completed
*   **Scope:** Modify `handleBackspace` and `handleDelete` to check `isEditableCell` (strict lock), only update `gridData` if editable, and remove any direct completion logic.
*   **Reason:** Ensure deletion actions respect strict lock and defer completion state logic to `useEffect`.
*   **Implementation:**
    1.  **In `handleBackspace` / `handleDelete`:**
        *   Call `isEditableCell` at the start.
        *   Wrap the `setGridData(...)` call within an `if (editable)` block.
        *   **REMOVE** any potential direct calls to `setCompletedWords`.
        *   Keep focus movement logic in `handleBackspace`.
    2.  Update `useCallback` dependencies.
*   **Test:** Logic review. E2E test: Delete from completed cell -> verify blocked. Delete from incomplete cell -> verify `gridData` clears.
*   **Check:**
    *   [x] `isEditableCell` Check Added/Verified
    *   [x] Deletion Logic Wrapped in `if (editable)` Block
    *   [x] Direct Completion Logic REMOVED
    *   [x] Dependencies Updated & Verified
    *   [x] Test Checked (Review, E2E Deletion Blocking)
*   **Notes:**
    ```text
    Ensured backspace/delete respect strict lock and only modify `gridData`. Completion state managed by `useEffect`.
    ```

---

### Step 3.5: Implement `useEffect` for Centralized Completion State Management

*   **Status:** Completed
*   **Scope:** Add a `useEffect` hook within `useGameStateManager` that runs when `gridData` changes. This effect calculates the complete set of correct words and updates the `completedWords` state.
*   **Reason:** To reliably update completion status *after* grid state changes, resolving synchronization issues and centralizing completion logic.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  Add `useEffect(() => { ... }, [gridData, puzzleData, checkWordCorrectness, completedWords, setCompletedWords])`.
    2.  Inside the effect:
        *   Check if `puzzleData` is loaded.
        *   Initialize `newlyCompletedWords = new Set<string>()`.
        *   Iterate through all `puzzleData.across` clues, call `checkWordCorrectness('across', number)`, add `wordId` to set if correct.
        *   Iterate through all `puzzleData.down` clues, call `checkWordCorrectness('down', number)`, add `wordId` to set if correct.
        *   Compare `newlyCompletedWords` with current `completedWords`.
        *   If different, call `setCompletedWords(newlyCompletedWords)`.
*   **Test:** Logic review. E2E test: Complete a word -> verify `completedWords` state updates correctly *after* the last letter appears in `gridData` (using DevTools). Verify cells become uneditable.
*   **Check:**
    *   [x] `useEffect` Hook Added
    *   [x] Effect Triggered by `gridData` Change
    *   [x] Correctness Check Logic Correctly Called Inside Effect
    *   [x] `completedWords` State Updated Conditionally
    *   [x] Dependencies Verified (`useEffect`)
    *   [x] Test Checked (Review, E2E State Timing & Locking)
*   **Notes:**
    ```text
    Implemented central `useEffect` hook to manage `completedWords` state based on `gridData` changes. This ensures state synchronization and correctness checks run on updated data. `setCompletedWords` is no longer exported by the hook.
    ```

---

### Step 3.6: Calculate `cellCompletionStatus` Map in Adapter

*   **Status:** Completed
*   **Scope:** Implement `useMemo` calculation in `ThemedCrossword.tsx` to derive `Map<string, { completed: boolean }>` from the `completedWords` state (now updated by the `useEffect`) and `puzzleData`. Remove unused `useGameStateManager` import.
*   **Reason:** Create data structure for passing completion status down efficiently.
*   **Implementation:** In `src/Crossword/components/ThemedCrossword.tsx`:
    1.  Remove unused `useGameStateManager` import.
    2.  Implement `useMemo` hook:
        *   Get `completedWords`, `puzzleData` from `gameState` prop.
        *   Import `getCellKey`.
        *   Iterate `completedWords`, look up geometry, use `getCellKey(r, c)` to populate `Map<string, { completed: boolean }>` marking completed cells `true`.
        *   Deps: `[gameState.completedWords, gameState.puzzleData]`. Add error handling.
*   **Test:** Code review. E2E test: Complete word -> Inspect `ThemedCrossword` props/state in DevTools -> verify `cellCompletionStatus` Map is correct.
*   **Check:**
    *   [x] Unused Import Removed
    *   [x] `getCellKey` Imported
    *   [x] `useMemo` Implemented Correctly
    *   [x] Map Calculation Logic Verified
    *   [x] Dependencies Verified (`useMemo`)
    *   [x] Test Checked (Review, E2E DevTools State Inspection)
*   **Notes:**
    ```text
    Implemented `cellCompletionStatus` map calculation in `ThemedCrossword` via `useMemo`, consuming the state updated by the central `useEffect`. Removed unused import.
    ```

---

### Step 3.7: Propagate `cellCompletionStatus` via Props/Context

*   **Status:** Completed
*   **Scope:** Pass calculated `cellCompletionStatus` map down: `ThemedCrossword` -> `CrosswordProvider` (prop & context) -> `CrosswordGrid`.
*   **Reason:** Make status available to grid rendering logic. Resolve TS error from Step 3.6.
*   **Implementation:** Standard prop/context drilling.
    1.  `ThemedCrossword`: Pass map as prop to `<CrosswordProvider>`.
    2.  `CrosswordProvider`: Add optional `cellCompletionStatus` prop (update `PropTypes` and `CrosswordProviderProps`), add to context value, update `useMemo` deps for context value.
    3.  `CrosswordContextType`: Add `cellCompletionStatus?: Map<string, { completed: boolean }>`.
    4.  `CrosswordGrid`: Consume from context.
*   **Test:** Code review. Static analysis (TS check should pass). E2E DevTools inspection: Verify map prop/context value propagation after completing a word.
*   **Check:**
    *   [x] Prop Type Added in `CrosswordProvider` (TS & PropTypes)
    *   [x] Context Type Updated (`context.ts`)
    *   [x] Prop Passed into Context Value (`CrosswordProvider`)
    *   [x] Context Consumed in `CrosswordGrid`
    *   [x] Test Checked (Review, Static Analysis, E2E DevTools)
*   **Notes:**
    ```text
    Added `cellCompletionStatus` to `CrosswordContextType`, `CrosswordProvider` PropTypes/Props, and included it in the context value. This resolves the TypeScript error from the previous step and ensures status propagates.
    ```

---

### Step 3.8: Implement Cell Styling Based on Completion Status

*   **Status:** Completed
*   **Scope:** Modify `CrosswordGrid` to pass status to `Cell`. Modify `Cell` to accept prop, use theme color, apply background with correct precedence.
*   **Reason:** Visually render completion status.
*   **Implementation:**
    1.  `CrosswordGrid`: Look up status using `getCellKey(r, c)` from the consumed context map, pass `completionStatus` prop to `<Cell>`.
    2.  `Cell`: Add optional `completionStatus?: { completed: boolean }` prop. Access `props.theme.completionBackground`. Modify background fill logic for **`Completion > Focus > Highlight > Default`** precedence.
*   **Test:** Runtime E2E Visual Testing:
    *   Complete a word -> Verify cells instantly change to `theme.completionBackground`.
    *   Focus a completed cell -> Verify color remains `completionBackground`.
    *   Highlight a clue with completed intersecting cells -> Verify completed cells remain `completionBackground`.
    *   Attempt input/delete on completed cell -> Verify visually blocked & color remains.
*   **Check:**
    *   [x] Status Lookup & Prop Pass in `CrosswordGrid` (uses `getCellKey`)
    *   [x] Prop Added to `Cell` (TS & PropTypes)
    *   [x] Theme Color Accessed in `Cell`
    *   [x] Styling Logic Implemented w/ Correct Precedence (`Completion > Focus > Highlight > Default`) in `Cell`
    *   [x] Test Checked (Runtime E2E Visuals, Precedence, Interactions)
*   **Notes:**
    ```text
    Final visual implementation step. Added `completionStatus` prop to Cell. Applied `theme.completionBackground` based on status, ensuring correct styling precedence (Completion > Focus > Highlight > Default) as per final decision. Visual feedback is now functional.
    ```

---

### Step 3.9: Update Phase Documentation

*   **Status:** Completed
*   **Scope:** Mark Phase 3 complete, documenting architecture and implementation (Strict Locking model, `useEffect` for completion state).
*   **Reason:** Record progress and final state.
*   **Implementation:** Final review and update of this document.
*   **Check:**
    *   [x] Docs Updated and Reviewed
*   **Notes:**
    ```text
    Phase 3 is complete. Key outcomes:
    - Centralized completion logic via `useEffect` in `useGameStateManager` ensures reliable state updates after grid changes.
    - Strict Locking model implemented: completed words are uneditable via input or deletion.
    - Completion status is propagated correctly via context.
    - Visual feedback (background color) is applied to completed cells using the theme color and the agreed styling precedence (Completion > Focus > Highlight > Default).
    The core functionality for identifying and visually marking completed words is now implemented.
    ```

---

**Phase 3 Complete.**

This documentation accurately reflects the work done and the final state of the prototype after Phase 3. Excellent work navigating the implementation and refining the interaction logic!