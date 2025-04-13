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
    *   [ ] Code Completed (Harness Setup)
    *   [ ] Test Checked (Refactored Provider Verified)
*   **Notes:**
    ```
    Successfully tested refactored CrosswordProvider via App.tsx harness. Confirmed it renders based on external state props and triggers correct interaction callbacks. Refactoring in Step 2.2 is validated. Remember to remove harness later.
    ```

---

### Step 2.4: Implement State Actions in `useGameStateManager`

*   **Scope:** Implement the actual state update logic within the action functions of the central hook.
*   **Reason:** To centralize the business logic for how interactions update the application state.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  Define and export action functions: `handleCellSelect(row, col)`, `handleMoveRequest(dRow, dCol)`, `handleDirectionToggle()`, `handleMoveToClueStart(direction, number)`, `handleBackspace()`, `handleDelete()`, etc.
    2.  Implement the logic within each function to calculate the new `selectedRow`, `selectedCol`, `currentDirection`, `currentNumber` based on the action and current state/`puzzleData`. Use the `set` functions from `useState` to update the state.
    3.  Return these action functions from the hook.
*   **Test:** Review logic. Unit tests ideal. Runtime testing via Step 2.6.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Implemented state update logic within useGameStateManager actions corresponding to provider callbacks.
    ```

---

### Step 2.5: Introduce `ThemedCrossword` Adapter & Cleanup Harness

*   **Scope:** Create the adapter component and remove the test harness from `App.tsx`.
*   **Reason:** Prepare for final integration using the adapter pattern and clean up temporary test code.
*   **Implementation:**
    1.  Create `src/Crossword/components/ThemedCrossword.tsx`.
    2.  **(Cleanup App.tsx):** Remove the harness local state (`harnessRow`, etc.) and harness callbacks (`handleHarnessCellSelect`, etc.) from `App.tsx`. Ensure `useGameStateManager` is called to get the full state object (`gameState`).
    3.  In `App.tsx`, render `<ThemedCrossword gameState={gameState} />` inside `<CrosswordArea>`. (Keep rendering `<ClueVisualiser>` separately in `<ClueArea>` for now).
    4.  Inside `ThemedCrossword.tsx`, receive `gameState` prop. Render `<CrosswordProvider>` (passing `<CrosswordGrid />` as needed).
*   **Test:** Grid should render. Verify harness code removed from `App.tsx`. Interaction wiring done next.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Adapter component created. App.tsx cleaned up from harness code. Ready for final wiring.
    ```

---

### Step 2.6: Connect State and Callbacks via `ThemedCrossword`

*   **Scope:** Wire the hook's state/actions to the refactored `CrosswordProvider` props/callbacks via the `ThemedCrossword` adapter. Implement imperative focus call.
*   **Reason:** Establish the final two-way data flow using the central state hook and adapter.
*   **Implementation:** In `src/Crossword/components/ThemedCrossword.tsx`:
    1.  Receive `gameState` prop (containing state and actions).
    2.  Create a `ref` for the `CrosswordProvider` to call its imperative `focus()` method.
    3.  Pass state values (`gameState.selectedRow`, etc.) to the corresponding props of `<CrosswordProvider>`.
    4.  Define stable handlers (using `useCallback`) for each interaction callback prop (`onCellSelect`, `onMoveRequest`, etc.). These handlers will call the corresponding action function from `gameState` (e.g., `gameState.handleCellSelect(row, col)`). After calling the action, potentially call `crosswordProviderRef.current?.focus()`.
    5.  Pass these handlers to the `<CrosswordProvider>` callback props.
*   **Test:**
    *   Run the app.
    *   Click cells, press arrow keys, space/tab, home/end, backspace, delete. Verify grid focus/highlight updates visually AND state updates correctly in `useGameStateManager`. Check if the grid input regains focus after interactions.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Final wiring via adapter complete. Hook drives provider state, provider interactions update hook. Imperative focus call added.
    ```

---

### Step 2.7: Implement & Render Basic `ClueVisualiser`

*   **Scope:** Create and render the component to display the currently active clue text.
*   **Reason:** Essential usability feedback.
*   **Implementation:**
    1.  Create `src/Crossword/components/ClueVisualiser.tsx` accepting props `direction`, `number`, `clueText`. Style it.
    2.  In `App.tsx`: Call hook to get state (`puzzleData`, `currentDirection`, `currentNumber`). Derive `clueText`. Render `<ClueVisualiser>` in `<ClueArea>`, passing necessary props.
*   **Test:** Click grid cells/change selection. Verify `ClueVisualiser` updates correctly based on central state (`currentDirection`, `currentNumber`).
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Clue display implemented and rendering in layout. Driven by central state.
    ```

---

### Step 2.8: Implement Clue Click -> `useGameStateManager` Update

*   **Scope:** Allow clicking the clue text to update grid focus/selection state.
*   **Reason:** Two-way navigation.
*   **Implementation:**
    1.  Ensure `handleMoveToClueStart(direction, number)` action exists in hook (from Step 2.4).
    2.  Modify `ClueVisualiser` to accept and call an `onClueClick` prop (passing `direction`, `number`).
    3.  In `App.tsx`, pass `handleMoveToClueStart` from hook to `ClueVisualiser`'s `onClueClick` prop.
*   **Test:** Click clue text. Verify grid focus/highlight updates correctly, driven by state change in hook flowing down to `CrosswordProvider`.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Clue click interaction implemented, completing two-way navigation.
    ```

---