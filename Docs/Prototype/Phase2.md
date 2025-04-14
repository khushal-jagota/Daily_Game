# Prototype Implementation: Phase 2 - Interaction, State Control, and Clue Display

**Goal:** Enable basic grid interaction, manage focus/selection state within `useGameStateManager`, refactor `CrosswordProvider` into a controlled component reflecting this external state, display the active clue, and enable two-way navigation between the grid and clue display.

**Prerequisite:**
*   Phase 1.75 completed: Basic application layout scaffold is in place, grid renders visibly.
*   Theme system consolidated (Phase 1.5).
*   `useGameStateManager` provides puzzle data.
*   Analysis complete: `CrosswordProvider` requires significant modification to become externally controlled for focus/selection.

---

### Step 2.1: Add Focus/Selection State Variables to `useGameStateManager` (State Holder Only)

*   **Scope:** Add the *state variables* for focus/selection to the central hook.
*   **Reason:** To establish the state structure within the single source of truth before modifying the provider.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  Add state variables using `useState` for `selectedRow`, `selectedCol`, `currentDirection`, and `currentNumber`. Initialize appropriately (e.g., find the first cell of the first 'across' clue, or use `0, 0, 'across', '1'`).
    2.  Return these new state values from the hook's return object alongside `puzzleData`.
    3.  **Do not** implement action functions (`handleCellSelect`, etc.) yet.
*   **Test:** In `App.tsx`, call the hook, destructure state. Log to console to verify initialization.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Hook now holds state variables for focus/selection/clue number. Ready for provider refactoring.
    ```

---

### Step 2.2.1: Add State Input & Callback Props to `CrosswordProvider`

*   **Scope:** Define and add all the new props required for external state control and interaction callbacks to `CrosswordProvider.tsx`.
*   **Reason:** To establish the new public interface for the controlled `CrosswordProvider` component.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  **Add State Input Props:** In the `CrosswordProviderProps` interface, add:
        *   `selectedRow: number`
        *   `selectedCol: number`
        *   `currentDirection: Direction`
        *   `currentNumber: string`
    2.  **Add Callback Props:** In the `CrosswordProviderProps` interface, add:
        *   `onCellSelect: (row: number, col: number) => void`
        *   `onMoveRequest?: (dRow: number, dCol: number) => void`
        *   `onDirectionToggleRequest?: () => void`
        *   `onMoveToRequest?: (row: number, col: number) => void`
        *   `onBackspaceRequest?: () => void`
        *   `onDeleteRequest?: () => void`
        *   `onCharacterEnteredRequest?: (row: number, col: number) => void;`
    3.  **Update PropTypes:** Add corresponding entries for all new props in `crosswordProviderPropTypes`. Use `PropTypes.number.isRequired`, `PropTypes.string.isRequired`, `PropTypes.oneOf(['across', 'down']).isRequired`, and `PropTypes.func` as appropriate. Note that required props in TypeScript might be optional in PropTypes if default values are provided in destructuring.
    4.  **Update Destructuring:** Add the new props to the component's props destructuring, providing default values for state props if appropriate for potential standalone usage (though our harness will provide them): `selectedRow = 0`, `selectedCol = 0`, `currentDirection = 'across'`, `currentNumber = ''`. Ensure optional callbacks are destructured correctly.
*   **Test:** Static analysis (`tsc --noEmit` or IDE checks) should pass. Ensure no syntax errors were introduced.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Added all new state and callback props to interface, PropTypes, and destructuring. The props establish the foundation for external state control.
    ```

---

### Step 2.2.2: Remove Internal State for Focus/Selection

*   **Scope:** Delete the internal `useState` declarations previously used to manage focus and selection state within `CrosswordProvider`.
*   **Reason:** To enforce reliance on the new state props and eliminate the source of the old internal state management.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Locate the `useState` calls for `focusedRow`, `focusedCol`, `currentDirection`, and `currentNumber`.
    2.  **Delete these lines entirely.**
    3.  Define simple constants to hold the prop values for clarity within the component scope (optional but can improve readability):
        ```typescript
        const focusedRow = selectedRow; // From props
        const focusedCol = selectedCol; // From props
        // currentDirection and currentNumber are already available from props
        ```
*   **Test:** Static analysis (`tsc --noEmit` or IDE checks) should pass. Check for any remaining references to the deleted state setter functions (`setFocusedRow`, etc.) - these will cause errors and need to be addressed in subsequent steps.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Removed internal useState calls for focus/selection state variables. Component now relies solely on props for these values, enforcing the controlled component pattern.
    ```

---

### Step 2.2.3: Modify Context Population

*   **Scope:** Update the `useMemo` hook that creates the `crosswordContext` value to use the incoming state props instead of the (now removed) internal state variables.
*   **Reason:** To ensure the context consumed by child components (`CrosswordGrid`, `Cell`) reflects the externally controlled state.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Locate the `useMemo` hook defining `crosswordContext`.
    2.  In the returned context object, ensure the following fields are populated using the prop values:
        *   `selectedPosition: { row: selectedRow, col: selectedCol }`
        *   `selectedDirection: currentDirection`
        *   `selectedNumber: currentNumber`
    3.  Update the dependency array of the `useMemo` hook to include `selectedRow`, `selectedCol`, `currentDirection`, `currentNumber`, along with other necessary dependencies.
*   **Test:** Static analysis (`tsc --noEmit` or IDE checks) should pass. Code review to confirm props are correctly mapped to context fields and included in the dependency array.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Updated crosswordContext useMemo to populate selectedPosition, selectedDirection, selectedNumber from props. Updated dependency array appropriately to ensure context updates when props change.
    ```

---

### Step 2.2.4: Refactor `handleCellClick`

*   **Scope:** Modify the `handleCellClick` function to only call the external callback prop.
*   **Reason:** To delegate the state update logic for cell clicks entirely to the external controller.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Locate the `handleCellClick` function definition.
    2.  Remove all lines within the `if (cellData.used)` block *except* for the call to `props.onCellSelect(row, col)`. Specifically, remove internal state updates and the internal `focus()` call.
    3.  Update the `useCallback` dependency array – it should now likely only depend on `onCellSelect`.
*   **Test:** Static analysis. Code review to ensure only the callback call remains. Functional test deferred to Step 2.3.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Simplified handleCellClick to only call props.onCellSelect. Removed internal logic and focus call. Updated dependencies to include only necessary values.
    ```

---

### Step 2.2.5: Refactor `handleInputKeyDown`

*   **Scope:** Modify the keyboard event handler to call the new external callback props instead of updating internal state or calling internal movement functions.
*   **Reason:** To delegate the handling of keyboard navigation and action logic to the external controller based on user intent.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Locate the `handleInputKeyDown` function definition.
    2.  Go through each `case` in the `switch (key)` statement:
        *   **Arrow Keys:** Replace calls to `moveRelative(-1, 0)` etc. with `props.onMoveRequest?.(-1, 0)` etc.
        *   **Space/Tab:** Replace calls to `setCurrentDirection` with `props.onDirectionToggleRequest?.()`. Keep `preventDefault` logic.
        *   **Backspace:** After `setCellCharacter(..., '')`, replace `moveBackward()` call with `props.onBackspaceRequest?.()`.
        *   **Delete:** After `setCellCharacter(..., '')`, add `props.onDeleteRequest?.()`.
        *   **Home/End:** Replace calls to `moveTo` with `props.onMoveToRequest?.(row, col)`.
        *   **Default (Character Keys):** Keep the call to `handleSingleCharacter(key)`. **Do not** add movement logic here.
    3.  Remove any internal `focus()` calls from within this handler.
    4.  Update the `useCallback` dependency array to include all the new callback props (`onMoveRequest`, `onDirectionToggleRequest`, etc.) and any other necessary dependencies (`getCellData`, `isCellEditable`, `handleSingleCharacter`, `setCellCharacter`, `data`, state props like `currentDirection`, `currentNumber`, `selectedRow`, `selectedCol`).
*   **Test:** Static analysis. Code review to ensure all internal state/movement calls are replaced with appropriate callback prop calls. Functional test deferred to Step 2.3.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Refactored handleInputKeyDown switch cases to call new on...Request props. Removed internal focus calls. Updated dependencies to include all necessary callback props and state values.
    ```

---

### Step 2.2.6: Refactor `handleSingleCharacter`

*   **Scope:** Modify the character input handler to notify the parent after setting the character, removing the internal move.
*   **Reason:** To delegate the "move after character entry" logic to the external controller.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Locate the `handleSingleCharacter` function.
    2.  Keep the initial `isCellEditable` check.
    3.  Keep the call to `setCellCharacter(focusedRow, focusedCol, char.toUpperCase())`.
    4.  **Remove** the call to the internal `moveForward()` function.
    5.  **Add** a call to the new callback prop: `props.onCharacterEnteredRequest?.(focusedRow, focusedCol)` (using the prop values `focusedRow`, `focusedCol`).
    6.  Update the `useCallback` dependency array to include `onCharacterEnteredRequest`, `isCellEditable`, `setCellCharacter`, `focusedRow`, `focusedCol`.
*   **Test:** Static analysis. Code review. Functional test deferred to Step 2.3.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Modified handleSingleCharacter to remove moveForward() and call onCharacterEnteredRequest callback instead. Updated dependencies to include the new callback prop and necessary state values.
    ```

---

### Step 2.2.7: Refactor `handleClueSelected` and `handleInputClick`

*   **Scope:** Modify handlers related to explicit clue selection and input field clicks to use external callbacks.
*   **Reason:** To ensure these interactions also delegate state changes externally.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Locate `handleClueSelected`. Remove the internal `moveTo(...)` call. Keep the existing `props.onClueSelected(...)` call if it exists. (The actual move will be initiated externally based on `onClueSelected` or directly via `onMoveToRequest`). Remove internal `focus()` call. Update `useCallback` dependencies (likely remove `moveTo`, keep `onClueSelected`, `clues`, `isCellEditable`, `focus`, `onMoveToRequest`). *Correction based on previous plan: use `onMoveToRequest` here.* Modify to call `props.onMoveToRequest?.(info.row, info.col)` instead of `moveTo`. Remove `focus()` call. Update dependencies.
    2.  Locate `handleInputClick`. Replace internal `setCurrentDirection` logic with a call to `props.onDirectionToggleRequest?.()`. Update `useCallback` dependencies (add `onDirectionToggleRequest`, remove `setCurrentDirection`).
*   **Test:** Static analysis. Code review. Functional test deferred to Step 2.3.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Refactored handleClueSelected to use onMoveToRequest. Refactored handleInputClick to use onDirectionToggleRequest. Removed internal calls/state updates and updated dependencies appropriately.
    ```

---

### Step 2.2.8: Remove Unused Internal Code

*   **Scope:** Delete the initial focus `useEffect` and the now-unused internal movement functions.
*   **Reason:** Code cleanup and simplification after refactoring.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Locate and **delete** the `useEffect` block responsible for setting the initial focus state (around lines 897-931 in the previously provided code).
    2.  Locate the internal helper functions: `moveTo`, `moveRelative`, `moveForward`, `moveBackward`. Verify they are no longer called anywhere internally after the previous refactoring steps.
    3.  If verified as unused, **delete these function definitions entirely.**
*   **Test:** Static analysis (`tsc --noEmit` or IDE checks) should pass. The component should still load correctly (runtime check in Step 2.3).
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Removed initial focus useEffect. Verified internal movement functions were unused and removed them. This completes the code cleanup phase of refactoring.
    ```

---

### Step 2.2.9: Final Review of Dependency Arrays

*   **Scope:** Perform a final check of all `useCallback` and `useMemo` dependency arrays within `CrosswordProvider.tsx`.
*   **Reason:** To prevent stale closures and ensure hooks update correctly when their dependencies (especially props and state) change.
*   **Implementation:** In `src/Crossword/components/CrosswordCore/CrosswordProvider.tsx`:
    1.  Review every `useCallback` hook (e.g., `handleCellClick`, `handleInputKeyDown`, `handleSingleCharacter`, etc.). Ensure all props, state (like `focused`), and functions from the outer scope that are used *inside* the callback are listed in the dependency array. This includes the new state props (`selectedRow`, etc.) and callback props (`onCellSelect`, `onMoveRequest`, etc.) where applicable.
    2.  Review the `useMemo` hook for `crosswordContext`. Ensure its dependency array accurately reflects all the values used to construct the context object (props like `selectedRow`, state like `focused`, other state like `gridData`, stable callbacks like `handleInputKeyDown`).
*   **Test:** Primarily code review. Use ESLint rules for exhaustive-deps if configured. Incorrect dependencies often manifest as subtle bugs later (e.g., handlers using stale state).
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Reviewed all dependency arrays in useCallback and useMemo hooks. Added missing props/callbacks where necessary. Confirmed context dependencies include all required values. This completes the refactoring of CrosswordProvider to use external state.
    ```

---

### Step 2.3: Test Refactored `CrosswordProvider` with `App.tsx` Harness

*   **Scope:** Verify the refactored `CrosswordProvider` by controlling it directly from `App.tsx` using temporary local state and handlers.
*   **Reason:** To isolate and confirm that `CrosswordProvider` correctly reflects external state and reports interactions via the new callbacks *before* full integration.
*   **Implementation:** In `src/App.tsx`:
    1.  **Use Hook for Init State:** Call `useGameStateManager` (from Step 2.1) to get the *initial* state values for `selectedRow`, `selectedCol`, etc.
    2.  **Add Harness State:** Add local `useState` hooks in `App.tsx`, *initialized* from the hook's initial state:
        ```typescript
        const initialGameState = useGameStateManager(); // Call hook once
        const [harnessRow, setHarnessRow] = useState(initialGameState.selectedRow);
        // ... other harness state vars initialized similarly ...
        ```
    3.  **Add Harness Callbacks:** Define handlers in `App.tsx` for *all* the new callbacks (`onCellSelect`, `onMoveRequest`, etc.). These handlers should update the *harness* state (`setHarnessRow`, etc.) and log messages.
    4.  **Pass Harness Props:** Pass the harness state values (`harnessRow`, etc.) and the harness callbacks to the *new* props of `CrosswordProvider`. Pass `puzzleData` from the hook.
*   **Test:**
    1.  **Incoming State:** Run app. Verify initial focus/highlight matches initial harness state. Use temporary buttons (optional) or React DevTools to directly change harness state values - verify the grid's visual focus/highlight updates immediately.
    2.  **Outgoing Callbacks:** Click cells, press arrow keys, space/tab, home/end, backspace, delete. Check console logs to verify the correct harness callbacks (`handleHarnessCellSelect`, `handleHarnessMoveRequest`, etc.) are triggered with the expected arguments. Check harness state updates correctly via DevTools. Verify grid visuals reflect the updated harness state after interaction.
*   **Check:**
    *   [x] Code Completed (Harness Setup)
    *   [x] Test Checked (Refactored Provider Verified)
*   **Notes:**
    ```
    Successfully tested refactored CrosswordProvider via App.tsx harness. Confirmed it renders based on external state props and triggers correct interaction callbacks. Refactoring in Step 2.2 is validated. Remember to remove harness later.
    ```

---

### Step 2.4: Implement State Actions in `useGameStateManager`

*   **Status:** Pending
*   **Scope:** Implement the actual state update logic within action functions inside the `useGameStateManager` hook. These functions will handle the core game mechanics based on user interaction intents reported by `CrosswordProvider`.
*   **Reason:** To centralize the game's state transition logic, making it the single source of truth for how the game state evolves.
*   **Overall Approach:** Reference the logic patterns from the *updated* `App.tsx` harness handlers (Step 2.3) as a starting point. Adapt, expand, and refine this logic within the hook's actions to implement the full game rules, using the hook's internal state (`selectedRow`, `puzzleData`, etc.) and state setters (`setSelectedRow`, etc.). Ensure robust handling of boundaries and cell validity.

---

#### Step 2.4.1: Implement Movement Actions

*   **Scope:** Implement `handleMoveRequest(dRow, dCol)` and `handleMoveToClueStart(direction, number)`.
*   **Reason:** To handle state updates related to relative directional moves (arrow keys) and direct jumps (clue clicks, home/end keys potentially map here later).
*   **Implementation:** In `useGameStateManager.ts`:
    1.  Define `handleMoveRequest(dRow, dCol)`:
        *   Reference `handleHarnessMoveRequest` from `App.tsx` for the basic pattern.
        *   Get current `selectedRow`, `selectedCol`.
        *   Calculate `targetRow`, `targetCol`.
        *   **Full Logic:** Check target boundaries. Use `puzzleData` or a derived grid structure to check if `targetCell` is valid and usable (not a black square). If invalid, return without changing state.
        *   Determine preferred direction based on `dRow`/`dCol`. Check if `targetCell` supports the preferred direction; if not, check the other direction. Determine the final `newDirection`.
        *   Look up the `newNumber` for the `targetCell` based on the `newDirection`.
        *   Update state: `setSelectedRow(targetRow)`, `setSelectedCol(targetCol)`, `setCurrentDirection(newDirection)`, `setCurrentNumber(newNumber)`.
    2.  Define `handleMoveToClueStart(direction, number)`:
        *   Use `puzzleData` to find the starting `row` and `col` for the given `direction` and `number`.
        *   Update state: `setSelectedRow(row)`, `setSelectedCol(col)`, `setCurrentDirection(direction)`, `setCurrentNumber(number)`.
*   **Test:** Logic review. Unit tests. Runtime testing via Step 2.6.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Implemented core movement logic in useGameStateManager. Created gridData state to facilitate cell lookup and implemented both movement handlers with proper boundary checking, direction determination, and state updates.
    ```

---

#### Step 2.4.2: Implement Selection/Toggle Actions

*   **Scope:** Implement `handleCellSelect(row, col)` and `handleDirectionToggle()`.
*   **Reason:** To handle state updates when a cell is directly clicked or the direction toggle is requested (space/tab/input click).
*   **Implementation:** In `useGameStateManager.ts`:
    1.  Define `handleCellSelect(row, col)`:
        *   Reference `handleHarnessCellSelect` from `App.tsx` for the basic pattern.
        *   Get current `selectedRow`, `selectedCol`, `currentDirection`. Use `puzzleData` or derived grid to get `cellData` for the clicked `row`, `col`.
        *   If cell is not used, return.
        *   **Full Logic:** Implement direction switching logic (e.g., if same cell clicked, try toggling; if new cell, prefer current direction if valid, otherwise switch). Determine `newDirection`.
        *   Look up `newNumber` based on `cellData[newDirection]`.
        *   Update state: `setSelectedRow(row)`, `setSelectedCol(col)`, `setCurrentDirection(newDirection)`, `setCurrentNumber(newNumber)`.
    2.  Define `handleDirectionToggle()`:
        *   Reference `handleHarnessDirectionToggleRequest` from `App.tsx` for the basic pattern.
        *   Get current `selectedRow`, `selectedCol`, `currentDirection`. Use `puzzleData`/grid to get `cellData`.
        *   Determine `newDirection = otherDirection(currentDirection)`.
        *   **Full Logic:** Check if `newDirection` is valid for the *current* cell (i.e., `cellData[newDirection]` exists).
        *   If valid, look up `newNumber = cellData[newDirection]`. Update state: `setCurrentDirection(newDirection)`, `setCurrentNumber(newNumber)`. If invalid, do nothing.
*   **Test:** Logic review. Unit tests. Runtime testing via Step 2.6.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Implemented cell selection and direction toggle logic in useGameStateManager. Both handlers properly check cell validity, handle special cases like clicking on the current cell, and ensure state updates follow the crossword logic.
    ```

---

#### Step 2.4.3: Implement Input/Delete Actions

*   **Scope:** Implement `handleCharacterEntered(row, col)`, `handleBackspace()`, `handleDelete()`.
*   **Reason:** To handle state updates related to character input (including auto-move) and deletion.
*   **Implementation:** In `useGameStateManager.ts`:
    1.  Define `handleCharacterEntered(row, col)`:
        *   This function is called *after* the character has been set in the provider's local grid state (via `setCellCharacter`).
        *   **Implement Auto-Move Logic:** Get current `selectedDirection`. Calculate the `nextRow`, `nextCol` based on this direction.
        *   Use `puzzleData`/grid to check validity/usability of the `nextCell`. (Consider rules: skip black squares? Skip already-filled/correct cells?)
        *   If `nextCell` is valid, determine its `nextNumber` based on `currentDirection`. Update state: `setSelectedRow(nextRow)`, `setSelectedCol(nextCol)`, `setCurrentNumber(nextNumber)`. If `nextCell` is invalid, do not change position state.
        *   *(Note: Updating the actual guess data centrally might be handled separately or as part of this action if needed in the future, but focus now is on focus/selection state).*
    2.  Define `handleBackspace()`:
        *   Get current `selectedRow`, `selectedCol`, `currentDirection`.
        *   **(Optional Guess Handling):** Decide if this action should also clear the guess in the central state (if managing guesses centrally later).
        *   **Implement Move-Backward Logic:** Calculate the `prevRow`, `prevCol` based on `currentDirection`.
        *   Check validity/usability of `prevCell`. If valid, determine its `prevNumber` based on `currentDirection`. Update state: `setSelectedRow(prevRow)`, `setSelectedCol(prevCol)`, `setCurrentNumber(prevNumber)`. If invalid, do not change position state.
    3.  Define `handleDelete()`:
        *   **(Optional Guess Handling):** Decide if this action should clear the guess in the central state.
        *   **No Movement:** This action typically does *not* change the `selectedRow`, `selectedCol`, `currentDirection`, or `currentNumber`.
*   **Test:** Logic review. Unit tests. Runtime testing via Step 2.6 (especially auto-move and backspace).
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Implemented character entry auto-move with proper direction handling and boundary checks. Added backspace move-backward logic with similar validations. Prepared handleDelete as a no-op for selection state (will be extended with guess clearing later).
    ```

#### Step 2.4.4: Update Hook Return Value

*   **Scope:** Ensure all new action functions are returned by `useGameStateManager`.
*   **Reason:** To make the actions available to consumers (like the `ThemedCrossword` adapter).
*   **Implementation:** In `useGameStateManager.ts`:
    1.  In the `return` statement of the hook, include all the newly defined action functions (`handleMoveRequest`, `handleCellSelect`, `handleDirectionToggle`, `handleCharacterEntered`, `handleBackspace`, `handleDelete`, `handleMoveToClueStart`).
*   **Test:** Static analysis. Check consuming components in Step 2.6.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Confirmed all state action functions are properly exported from the useGameStateManager hook, making them available to consumer components. This completes the state action implementation for Phase 2.
    ```

---

### Step 2.5: Introduce `ThemedCrossword` Adapter & Cleanup Harness

*   **Status:** Completed
*   **Scope:** Create the adapter component and remove the test harness from `App.tsx`.
*   **Reason:** Prepare for final integration using the adapter pattern and clean up temporary test code.
*   **Implementation:**
    1.  Create `src/Crossword/components/ThemedCrossword.tsx`.
    2.  **(Cleanup App.tsx):** Remove the harness local state (`harnessRow`, etc.) and harness callbacks (`handleHarnessCellSelect`, etc.) from `App.tsx`. Ensure `useGameStateManager` is called to get the full state object (`gameState`).
    3.  In `App.tsx`, render `<ThemedCrossword gameState={gameState} />` inside `<CrosswordArea>`. (Keep rendering `<ClueVisualiser>` separately in `<ClueArea>` for now).
    4.  Inside `ThemedCrossword.tsx`, receive `gameState` prop. Render `<CrosswordProvider>` (passing `<CrosswordGrid />` as needed).
*   **Test:** Grid should render. Verify harness code removed from `App.tsx`. Interaction wiring done next.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Created ThemedCrossword adapter component with basic structure. Cleaned up App.tsx by removing all harness code and updated it to use the new adapter. The adapter properly passes selection state from gameState to CrosswordProvider (callback wiring will be done in next step).
    ```

---

### Step 2.6: Connect State and Callbacks via `ThemedCrossword`

*   **Status:** Completed
*   **Scope:** Wire the hook's state/actions to the refactored `CrosswordProvider` props/callbacks via the `ThemedCrossword` adapter. Implement imperative focus call.
*   **Reason:** Establish the final two-way data flow using the central state hook and adapter. Fix the input focus issue observed during harness testing.
*   **Implementation:** In `src/Crossword/components/ThemedCrossword.tsx`:
    1.  Receive `gameState` prop (containing state and actions).
    2.  Create a `ref` for the `CrosswordProvider` to call its imperative `focus()` method. (`const crosswordProviderRef = useRef<CrosswordProviderImperative>(null);`)
    3.  Pass state values (`gameState.selectedRow`, etc.) to the corresponding props of `<CrosswordProvider>`.
    4.  Define stable handlers (using `useCallback`) for each interaction callback prop (`onCellSelect`, `onMoveRequest`, `onCharacterEnteredRequest`, etc.). These handlers will:
        *   Call the corresponding action function from `gameState` (e.g., `gameState.handleCellSelect(row, col)`).
        *   **After** calling the action, call `crosswordProviderRef.current?.focus()` to ensure the input regains focus.
    5.  Pass these handlers to the `<CrosswordProvider>` callback props and pass the `ref` to the provider: `<CrosswordProvider ref={crosswordProviderRef} ... >`.
*   **Test:**
    *   Run the app.
    *   Click cells, press arrow keys, space/tab, home/end, backspace, delete, type characters.
    *   Verify grid focus/highlight updates visually AND state updates correctly in `useGameStateManager` (use React DevTools).
    *   Verify the grid input **regains focus immediately** after interactions (typing, clicking, arrow keys).
    *   Verify **auto-move works correctly** after typing characters.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Successfully connected gameState actions to CrosswordProvider callbacks through ThemedCrossword adapter. Added imperative focus management to ensure keyboard focus is maintained after interactions. Implemented properly typed interface for the component props. The adapter now properly converts interaction events into state updates and maintains focus throughout.
    ```

---

### Step 2.7: Implement & Render Basic `ClueVisualiser`

*   **Status:** Completed
*   **Scope:** Create and render the component to display the currently active clue text.
*   **Reason:** Essential usability feedback, showing the clue for the selected word.
*   **Implementation:**
    1.  Create `src/Crossword/components/ClueVisualiser.tsx` accepting props `direction`, `number`, `clueText`. Style it using `styled-components`.
    2.  In `App.tsx`: Call `useGameStateManager` to get state (`puzzleData`, `currentDirection`, `currentNumber`). Use this state to derive the `clueText` for the active clue (look up in `puzzleData.across` or `puzzleData.down` based on `currentDirection` and `currentNumber`).
    3.  Render `<ClueVisualiser>` inside the `<ClueArea>` layout component in `App.tsx`, passing the necessary props (`currentDirection`, `currentNumber`, derived `clueText`).
*   **Test:** Click grid cells/change selection via keyboard. Verify `ClueVisualiser` updates correctly to display the text of the currently selected clue based on the central state (`currentDirection`, `currentNumber`).
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Created ClueVisualiser component with styled container, header and text. Component displays the active clue from gameState, and correctly shows the direction, number, and clue text. App.tsx now derives the active clue text from gameState's puzzleData and current selection.
    ```

---

### Step 2.8: Implement Clue Click -> `useGameStateManager` Update

*   **Status:** Pending
*   **Scope:** Allow clicking the clue text in `ClueVisualiser` to update grid focus/selection state via the state manager.
*   **Reason:** Two-way navigation between grid and clue display.
*   **Implementation:**
    1.  Ensure `handleMoveToClueStart(direction, number)` action exists in `useGameStateManager` (from Step 2.4). This action should update `selectedRow`, `selectedCol`, `currentDirection`, and `currentNumber` to the start of the specified clue.
    2.  Modify `ClueVisualiser` component (`src/Crossword/components/ClueVisualiser.tsx`) to accept and call an `onClueClick` prop when the clue text is clicked, passing its `direction` and `number`. Make the clue text clickable (e.g., wrap in a button or add `onClick` to its container).
    3.  In `App.tsx`, pass the `gameState.handleMoveToClueStart` action function (retrieved from the hook) to the `ClueVisualiser`'s `onClueClick` prop.
*   **Test:** Click the clue text displayed in the `ClueVisualiser`. Verify the grid focus/highlight updates correctly to the start of that clue, driven by the state change in `useGameStateManager` flowing down through the adapter to `CrosswordProvider`.
*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked
*   **Notes:**
    ```
    Working well
    ```

    ### Phase 2 Conclusion & Next Steps

*   **Upon Completion:** Once all steps (2.1 through 2.8) are completed and validated, Phase 2 will be considered finished. The application will have basic grid interaction, externally controlled focus/selection state managed by `useGameStateManager`, a functioning clue display, and two-way navigation.
*   **Immediate Next Task (Pre-Phase 3):** Before proceeding with Phase 3 features (word completion status, coloring, scoring, etc.), the next critical step will be to **implement Central Guess Management**. This involves:
    1.  Moving the `gridData` state (specifically guess data) from `CrosswordProvider` into `useGameStateManager`.
    2.  Modifying `CrosswordProvider` props/callbacks for character input (e.g., using `onGuessAttempt(row, col, char)` instead of `onCharacterEnteredRequest`).
    3.  Implementing a `handleGuessInput` action in `useGameStateManager` to update the central `gridData` state and handle associated focus movement.
*   **Rationale:** Performing this refactor immediately after Phase 2 provides the optimal architectural foundation (true single source of truth) for implementing subsequent features cleanly and efficiently. **This refactor will also enable refining interaction behaviors like the two-step Backspace (delete char before moving).**