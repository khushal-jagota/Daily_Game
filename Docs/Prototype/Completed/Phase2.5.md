# Phase 2.5: Centralize Guess State (Revised v4 - Internal Completion Stub & Deferred Unit Tests)

*   **Goal:** Move ownership of the mutable `gridData` (containing player guesses) from `CrosswordProvider` to `useGameStateManager`. Introduce a *stub* for `completedWords` state within the hook to handle validation internally, making the hook the single source of truth for all dynamic game state related to guesses, selection, and editability based on completion.
*   **Rationale:** Consolidates state management, simplifies implementation of validation/completion logic within the hook via dedicated helpers (`isEditableCell`, `getCellData`), enables easier state persistence, provides a cleaner architecture by decoupling core guess mechanics from the UI component, and enables refinement of interactions like the two-step backspace. **Key Improvement:** Centralizes editability validation logic *using internal state* from the start of this phase, improving architectural alignment earlier. Encourages use of internal helpers for clarity.
*   **Testing Strategy Note:** Formal unit testing for hook actions is deferred to a later phase (tracked as tech debt). This phase relies on thorough code reviews, extensive `console.log` debugging during development, and rigorous manual E2E testing in Step 2.5.10. A ticket for unit tests must be scheduled immediately post-Phase 2.5.
*   **Version Control:** Ensure all work for Phase 2.5 is done on a dedicated feature branch with frequent, logical commits at the end of each step.

---

### Step 2.5.1: Modify `useGameStateManager` - State & Helpers Verification (Add Completion Stub)

*   **Status:** Completed
*   **Scope:** Verify `gridData` state, `getCellData` helper. **Introduce internal `completedWords` state stub.** Define `isEditableCell` helper signature to use internal state.
*   **Reason:** To ensure the foundation for central state modification is correct and prepare for centralized validation using *internal* completion state from the outset of this phase. Critical for avoiding stale state issues and aligning with Single Source of Truth principle earlier.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  Locate `gridData` state: `const [gridData, setGridData] = useState<GridData>(...)`. Verify initialization.
    2.  Locate `getCellData` helper. Verify it uses `gridData` state and is memoized correctly (`[gridData]` dependency).
    3.  **Add `completedWords` State Stub:** Introduce `const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());`.
    4.  Define the internal `isEditableCell` helper: `const isEditableCell = useCallback((row: number, col: number): boolean => { ... }, [getCellData, completedWords]);`. Signature no longer takes `completedWordIds`. Dependencies include `getCellData` and `completedWords`. Add placeholder log.
*   **Test:** Code review and static analysis (including ESLint hook dependency checks). Confirm structure, dependencies, new state stub, and updated helper stub signature/dependencies are correct.
*   **Check:**
    *   [x] Code Reviewed
    *   [x] Dependency Array Verified (`getCellData`, `isEditableCell` stub)
    *   [x] `completedWords` State Stub Added
    *   [x] Validation Helper Stub Created (`isEditableCell` using internal state)
    *   [x] Test Checked (Static)
*   **Notes:**
    ```text
    Ensuring getCellData is correctly memoized is vital.
    Introducing isEditableCell to use internal completedWords state aligns architecture early.
    Stubbed completedWords state won't be modified in this phase, only read by the helper.
    ```

---

### Step 2.5.2: Implement `handleGuessInput` Action and `isEditableCell` Logic in `useGameStateManager`

*   **Status:** Completed
*   **Scope:** Implement the `isEditableCell` helper logic (reading internal state). Create the `handleGuessInput` action for character input, using the helper for validation, updating central guess state, and performing auto-move.
*   **Reason:** To centralize the logic associated with typing a letter, combining validation (based on internal state), guess update, and focus movement using the abstracted validation helper.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  **Implement `isEditableCell`:** Replace `/* TODO */`. Logic checks `getCellData`, constructs `wordIdAcross`/`wordIdDown`, checks `completedWords.has()`, returns `!isCompleted`. Add logging. Verify deps `[getCellData, completedWords]`.
    2.  **Define `handleGuessInput`:** `handleGuessInput(row, col, char)`. No `completedWordIds` arg. Wrap in `useCallback`.
    3.  **Inside `handleGuessInput`:** Log inputs. Call `isEditableCell`. If editable, call `setGridData(produce(...))`. Implement auto-move (extracting helper encouraged). Add logs.
    4.  **Dependency Management:** Define `useCallback` deps carefully. Comment exclusions.
*   **Test:** Logic review. Manual Dev Testing w/ logs. E2E testing (Step 2.5.10).
*   **Check:**
    *   [x] `isEditableCell` Helper Logic Implemented w/ Logging (Reads internal state)
    *   [x] `handleGuessInput` Code Completed w/ Logging (No `completedWordIds` arg)
    *   [x] Validation Call Updated in `handleGuessInput`
    *   [x] Auto-Move Logic Added to `handleGuessInput` (Helper encouraged)
    *   [x] Dependencies Verified & Commented
    *   [x] Test Checked (Review, Dev Logs)
*   **Notes:**
    ```text
    Unit tests deferred. Relying on detailed logging and E2E tests.
    Validation logic centralized in isEditableCell, now reads internal state. Dependency vigilance crucial.
    Encourage use of internal helpers for complex parts like auto-move. Logic for newNumber in auto-move verified correct.
    ```

---

### Step 2.5.3: Modify `handleBackspace` / `handleDelete` Actions in `useGameStateManager`

*   **Status:** Completed
*   **Scope:** Update these actions to use the central validation helper (reading internal state), modify central `gridData`, and handle focus movement (backspace).
*   **Reason:** To ensure deletions correctly update central state, respect completion status via the central helper using internal state, and couple with movement where appropriate.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  **Modify `handleBackspace`:** Remove `completedWordIds` arg. Log context. Call `isEditableCell`. If editable, call `setGridData` to clear guess. Move backward logic follows. Log updates. Update deps.
    2.  **Modify `handleDelete`:** Remove `completedWordIds` arg. Log context. Call `isEditableCell`. If editable, call `setGridData` to clear guess. Log updates. Update deps.
*   **Test:** Logic review. Manual Dev Testing w/ logs. E2E testing (Step 2.5.10).
*   **Check:**
    *   [x] `handleBackspace` Code Completed w/ Validation & Logging (No `completedWordIds` arg)
    *   [x] `handleDelete` Code Completed w/ Validation & Logging (No `completedWordIds` arg)
    *   [x] Dependencies Verified & Commented
    *   [x] Test Checked (Review, Dev Logs)
*   **Notes:**
    ```text
    Unit tests deferred. Relying on detailed logging and E2E tests.
    Both actions use central isEditableCell helper reading internal state. Dependencies checked.
    Consider future two-step backspace refinement. Consider move calculation helper.
    ```

---

### Step 2.5.4: Remove `handleCharacterEntered` Action in `useGameStateManager`

*   **Status:** Completed
*   **Scope:** Remove the now-redundant action function from the hook.
*   **Reason:** Its auto-move logic has been merged into `handleGuessInput`.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`: Delete the entire function definition and `useCallback` wrapper for `handleCharacterEntered`. Remove from return object.
*   **Test:** Static analysis (`tsc`, lint). Ensure no build errors or warnings. Check Step 2.5.5 requires removal.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked (Static)
*   **Notes:**
    ```text
    Clean removal of obsolete action.
    ```

---

### Step 2.5.5: Update `useGameStateManager` Return Value

*   **Status:** Completed
*   **Scope:** Adjust the hook's return object to export the correct state and actions reflecting the changes.
*   **Reason:** To provide the accurate public interface for consumers and allow inspection of internal state for testing/debugging.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`: In the `return { ... }` statement:
    1.  Ensure `gridData` is included.
    2.  **Add `completedWords`** (for DevTools inspection/testing in this phase).
    3.  Add `handleGuessInput`.
    4.  Ensure modified `handleBackspace` and `handleDelete` are included.
    5.  **Remove** `handleCharacterEntered`.
    6.  Verify all other previously exported state/actions remain.
*   **Test:** Static analysis (`tsc`). Check adapter wiring (Step 2.5.10) relies on this updated signature (for actions) and DevTools can inspect `completedWords`.
*   **Check:**
    *   [x] Code Completed (`completedWords` added to return)
    *   [x] Test Checked (Static)
*   **Notes:**
    ```text
    Hook's public contract updated. Returning completedWords stub allows test manipulation via DevTools.
    Verified correct actions/state exported post 2.5.1-2.5.4.
    ```

---

### Step 2.5.6: Modify `CrosswordProvider` - Remove Internal State & Logic

*   **Status:** Completed
*   **Scope:** Remove the provider's local `gridData` state and internal functions (`setCellCharacter`, `isCellEditable`).
*   **Reason:** This state, its mutation logic, and associated validation are now managed centrally by the hook.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Delete the `useState` call for `gridData`.
    2.  Delete the internal `setCellCharacter` function/`useCallback` wrapper.
    3.  Delete the internal `isCellEditable` function/`useCallback` wrapper.
*   **Test:** Static analysis (`tsc`, lint). Ensure no internal references remain (build/lint errors expected if references linger).
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked (Static)
*   **Notes:**
    ```text
    Gutting provider's obsolete internal state, mutation, and validation logic for guesses.
    Introduces expected errors in functions that referenced deleted items (e.g., handleInputKeyDown, getCellData). These will be fixed in subsequent steps.
    ```

---

### Step 2.5.7: Modify `CrosswordProvider` - Update Props Interface

*   **Status:** Completed
*   **Scope:** Change the provider's props interface (PropTypes and TypeScript) to accept `gridData` and use the new `onGuessAttempt` input callback signature. **Remove `completedWordIds` prop.**
*   **Reason:** Align provider's external contract: receives data display instructions, forwards interaction events. Removes dependency on completion status.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  **Update `crosswordProviderPropTypes`:** Add `gridData`. Remove `onCharacterEnteredRequest`. Add `onGuessAttempt`. **Remove `completedWordIds`**.
    2.  **Update `CrosswordProviderProps` (TypeScript):** Add `gridData: GridData;`. Remove `onCharacterEnteredRequest?`. Add `onGuessAttempt?: (row: number, col: number, char: string) => void;`. **Remove `completedWordIds?: Set<string>;`**.
    3.  **Update Component Destructuring:** Add `gridData`, `onGuessAttempt`. Remove `onCharacterEnteredRequest`. **Remove `completedWordIds`**.
*   **Test:** Static analysis (`tsc`). Ensure no type errors here or in adapter (Step 2.5.10).
*   **Check:**
    *   [x] PropTypes Updated (Removed `completedWordIds`)
    *   [x] TypeScript Props Updated (Removed `completedWordIds`)
    *   [x] Destructuring Updated (Removed `completedWordIds`)
    *   [x] Test Checked (Static)
*   **Notes:**
    ```text
    Adjusting the provider's "API". Explicitly removed completedWordIds prop.
    ```

---

### Step 2.5.8: Modify `CrosswordProvider` - Update Internal Handlers

*   **Status:** Completed
*   **Scope:** Adapt internal handlers (`handleSingleCharacter`, `handleInputKeyDown`) to use new props/callbacks, remove calls to deleted internal functions, and remove internal validation checks. Fix dependencies.
*   **Reason:** Make provider a pure event forwarder for guess/delete actions, delegating validation and state updates entirely. Fixes errors introduced in 2.5.6.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  **Modify `handleSingleCharacter`:**
        *   Remove calls to (deleted) `setCellCharacter` and `isCellEditable`.
        *   Replace `onCharacterEnteredRequest?.(...)` call with `onGuessAttempt?.(selectedRow, selectedCol, char.toUpperCase())`. Ensure correct arguments are passed.
        *   Update `useCallback` dependencies: remove `setCellCharacter`, `isCellEditable`. Add `onGuessAttempt`, `selectedRow`, `selectedCol`.
    2.  **Modify `handleInputKeyDown`:**
        *   In `Backspace` and `Delete` cases, remove calls to (deleted) `setCellCharacter` and surrounding `if (isEditableCell(...))` check. Ensure `onBackspaceRequest?.()` / `onDeleteRequest?.()` are still called unconditionally.
        *   Update `useCallback` dependencies: remove `setCellCharacter`, `isCellEditable`. Add `onBackspaceRequest`, `onDeleteRequest`. Verify others. Use linters and comment exclusions.
    3.  Perform cleanup of unused variables/imports.
*   **Test:** Static analysis (`tsc`, lint). Runtime validation prep for Step 2.5.10.
*   **Check:**
    *   [x] `handleSingleCharacter` Updated (Calls `onGuessAttempt` correctly)
    *   [x] `handleInputKeyDown` Updated (Backspace/Delete unconditional forward)
    *   [x] Internal Validation Removed
    *   [x] Dependencies Verified & Commented
    *   [x] Test Checked (Static & Runtime Prep)
*   **Notes:**
    ```text
    Provider now forwards guess/delete events without internal state updates or validation. Dependency checking is key. Resolved errors from 2.5.6.
    ```

---

### Step 2.5.9: Modify `CrosswordProvider` - Update Context Value & `getCellData`

*   **Status:** Completed
*   **Scope:** Ensure the `CrosswordContext` provided by this component uses the `gridData` received via props. Update `getCellData` to read from the prop.
*   **Reason:** To ensure child components like `CrosswordGrid` receive the centrally managed guess data through context for rendering. Fix `getCellData` logic.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  **Update `getCellData`:** Modify the function to read from the `gridData` *prop*. Update its `useCallback` dependency array to include the `gridData` prop variable.
    2.  Locate `useMemo` hook defining `crosswordContext`.
    3.  Ensure `gridData` field uses the `gridData` prop variable: `{ ..., gridData, ... }`.
    4.  Add `gridData` prop variable to the context's `useMemo` dependency array.
*   **Test:** Static analysis (`tsc`, lint). Runtime validation prep (visual check of guesses) for Step 2.5.10.
*   **Check:**
    *   [x] `getCellData` Updated (Reads prop, deps updated)
    *   [x] Context `useMemo` Updated (Uses prop)
    *   [x] Context Dependency Array Updated
    *   [x] Test Checked (Static & Runtime Prep)
*   **Notes:**
    ```text
    Ensured UI components consuming context get the correct, centrally-managed gridData prop. Fixed errors in getCellData and functions calling it.
    ```

---

### Step 2.5.10: Modify `ThemedCrossword` - Update Adapter Wiring & Test

*   **Status:** Completed
*   **Scope:** Update the adapter component to pass the `gridData` prop down, wire the new/modified callbacks (without `completedWordIds`), remove props related to completion status, and perform rigorous end-to-end testing including validation against the hook's internal state.
*   **Reason:** To complete the connection loop and validate the entire refactor, including testing the internally managed validation logic.
*   **Implementation:** In `src/Crossword/components/ThemedCrossword.tsx`:
    1.  **Get Hook State/Actions:** Destructure `gridData`, `handleGuessInput`, `handleBackspace`, `handleDelete` from `useGameStateManager()`. Also destructure `completedWords` for potential DevTools inspection during testing.
    2.  **Pass `gridData` Prop:** `<CrosswordProvider gridData={gameState.gridData} ... />`.
    3.  **Define `handleGuessAttempt` Handler:** `useCallback((row, col, char) => { gameState.handleGuessInput(row, col, char); focus(); }, [gameState, focus])`. Note: No `completedWordIds` passed. Update dependencies. Comment exclusions.
    4.  **Update `handleBackspaceRequest` / `handleDeleteRequest` Handlers:** `useCallback(() => { gameState.handleBackspace(); focus(); }, [gameState, focus])` / `useCallback(() => { gameState.handleDelete(); focus(); }, [gameState, focus])`. Note: No `completedWordIds` passed. Update dependencies. Comment exclusions.
    5.  **Update Prop Wiring:** Pass updated handlers to `onGuessAttempt`, `onBackspaceRequest`, `onDeleteRequest`. Remove `onCharacterEnteredRequest`. **Remove `completedWordIds` prop** if it was ever passed to `CrosswordProvider`.
*   **Test:** **Full Runtime End-to-End Testing with Console Logs & DevTools:**
    *   **Character Input:** Type letters. Verify visual update AND console logs from `handleGuessInput` confirm guess update AND auto-move logic triggers correctly.
    *   **Backspace:** Press on non-empty cell. Verify guess clears (visually + log from `handleBackspace`) AND focus moves back (log from `handleBackspace`). Press on empty cell. Verify focus moves back (log from `handleBackspace`).
    *   **Delete:** Press on non-empty cell. Verify guess clears (visually + log from `handleDelete`) AND focus does NOT move. Press on empty cell (no effect expected).
    *   **Validation Testing:**
        *   Use React DevTools to **directly modify the `completedWords` Set state** within `useGameStateManager`. Add a known `wordId` (e.g., "1-across").
        *   Attempt to type/backspace/delete within cells belonging *only* to that completed word.
        *   **Verify**: Console logs from `isEditableCell` show `false`. Console logs confirming state updates (`setGridData`) are *not* triggered. UI input is blocked.
        *   Attempt to type/backspace/delete in cells *not* part of the manually completed word. Verify these actions *are* allowed (logs show `isEditableCell` true, state updates occur, UI reflects changes).
        *   Clear the `completedWords` state via DevTools and re-test input is allowed again.
    *   **Movement/Selection:** Re-test arrow keys, clicks, direction toggles.
    *   **Focus:** Verify input focus is consistently returned after *all* interactions.
    *   **State Inspection:** Use React DevTools to monitor `useGameStateManager` state - confirm `gridData` (guesses) and selection state update centrally as expected. Confirm `completedWords` state is present (though only manipulated via DevTools in this phase).
*   **Check:**
    *   [x] `gridData` Prop Passed
    *   [x] Callbacks Defined & Wired Correctly (No `completedWordIds` passed)
    *   [x] `completedWordIds` Prop Removed from Provider
    *   [x] Dependencies Verified & Commented
    *   [x] Test Checked (Runtime E2E, DevTools **manipulation for Validation**, Logs, Edge Cases)
*   **Notes:**
    ```text
    Critical integration and testing step. Validation behavior now tested by directly manipulating internal hook state via DevTools. Use console logs heavily to verify behavior.
    ```

---

### Step 2.5.11: Update Phase Documentation & Create Unit Test Ticket

*   **Status:** Pending
*   **Scope:** Mark Phase 2.5 as complete, document key decisions, and create the tech debt ticket.
*   **Reason:** Record progress, capture architectural decisions, ensure follow-up on testing.
*   **Implementation:**
    1.  Update tracking documents (`Phase2.md`, etc.). **Specifically note:**
        *   Successful centralization of `gridData` guess state.
        *   Abstraction of validation into `isEditableCell` within the hook, reading *internal* `completedWords` state stub introduced in this phase.
        *   Removal of `completedWordIds` argument passing.
        *   Encouragement of internal helper functions.
        *   Deferral of unit tests but confirmation of rigorous E2E validation strategy.
    2.  **Create a new ticket/issue** in the project backlog: "Implement Unit Tests for useGameStateManager Actions/Helpers". Assign high priority and schedule for sprint immediately following Phase 2.5 completion.
*   **Check:**
    *   [x] Docs Updated
    *   [x] Key Architectural Decisions Documented
    *   [x] Unit Test Ticket Created & Prioritized
*   **Notes:**
    ```text
    Formally close out the phase, document the refined architecture, and ensure the testing tech debt is formally tracked and scheduled.
    ```

---