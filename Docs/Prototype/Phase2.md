# Prototype Implementation: Phase 2 - Interaction and Clue Display

**Goal:** Enable basic grid interaction (clicking cells, updating focus state), display the currently active clue, and allow clicking the clue to refocus the grid, all coordinated via the `useGameStateManager` hook.

**Prerequisite:** Phase 1 completed successfully. `useGameStateManager` provides puzzle data.

---

### Step 2.1: Introduce `ThemedCrossword` Wrapper
*   **Implementation:**
    *   Create `src/Crossword/components/ThemedCrossword.tsx`.
    *   This component will act as the primary bridge between the `useGameStateManager` hook and the `CrosswordCore` components.
    *   In `App.tsx`, *call* `useGameStateManager` and pass the *entire returned state object and any necessary action functions* down as props to `<ThemedCrossword>`.
    *   `<ThemedCrossword>` will then render `<CrosswordProvider>` and `<ClueVisualiser>` (later), passing the required specific props/callbacks down to them.
*   **Test:** Refactor `App.tsx` to render `<ThemedCrossword {...gameState} />` (where `gameState` is the object returned by `useGameStateManager`). Ensure the grid still renders correctly via `ThemedCrossword`.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Introduces an adapter layer for cleaner separation of concerns.
    ```

---

### Step 2.2: Add Focus/Selection State to `useGameStateManager`
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    *   Add new state variables using `useState` to track the currently selected cell (e.g., `selectedRow`, `selectedCol`) and the current input direction (`currentDirection: 'across' | 'down'`). Initialize appropriately (e.g., -1 or null for selection, 'across' for direction).
    *   Define and export functions from the hook to update this state (e.g., `handleCellSelect(row, col)`, `toggleDirection()`). These functions will use the `set` functions from `useState`.
    *   Return the new state values (`selectedRow`, `selectedCol`, `currentDirection`) and the new action functions (`handleCellSelect`, `toggleDirection`) from the hook's return object.
*   **Test:** In `App.tsx` (or temporarily in `ThemedCrossword`), call the hook, destructure the new state/functions, and add temporary buttons or `useEffect` hooks to call `handleCellSelect` or `toggleDirection`. Log the state values returned from the hook to verify they update correctly in response to these calls.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Extending the hook with focus state and update logic.
    ```

---

### Step 2.3: Connect Grid Click -> `useGameStateManager` Update
*   **Implementation:**
    *   Modify `CrosswordProvider.tsx` to accept an `onCellClick(row, col)` prop (or identify an equivalent existing callback – **verify this callback exists in the old code and its exact signature**).
    *   In `ThemedCrossword.tsx`, receive the `handleCellSelect` function (from the `useGameStateManager` hook via props) and pass it down to `<CrosswordProvider>` as the `onCellClick` prop (or the correctly named prop).
    *   **(Optional Refinement):** Consider if clicking the same cell should toggle direction. This logic could live inside the `handleCellSelect` function within `useGameStateManager` (comparing new `row, col` to existing `selectedRow, selectedCol`) or potentially by modifying `CrosswordProvider` to call a separate `onDirectionToggle` prop if available. Start simple: just connect the cell selection first.
*   **Test:** Run the app. Click different cells in the `CrosswordGrid`. Use React DevTools or console logs triggered by state changes in `useGameStateManager` (e.g., inside a `useEffect` in `App.tsx` or `ThemedCrossword` that logs `selectedRow`, `selectedCol`) to verify that state within the hook updates correctly based on grid clicks.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Connecting user interaction in the grid back to the central state hook. Requires verifying/adapting CrosswordProvider's callbacks.
    ```

---

### Step 2.4: Implement & Render Basic `ClueVisualiser`
*   **Implementation:**
    *   Create `src/Crossword/components/ClueVisualiser.tsx`.
    *   This component should accept props like `currentDirection`, `currentNumber` (derived from selected cell + puzzle data), and the relevant `clueText`. Define its prop types.
    *   In `ThemedCrossword.tsx`:
        *   Get the necessary state (`puzzleData`, `selectedRow`, `selectedCol`, `currentDirection`) from the props passed down (originating from `useGameStateManager`).
        *   Implement logic to determine the `currentNumber` (for both 'across' and 'down' clues potentially associated with the `selectedRow`, `selectedCol`) and then look up the corresponding `clueText` from `puzzleData` based on the `currentDirection`. Handle edge cases where no cell is selected or the selected cell isn't part of a clue in the current direction (display placeholder text).
        *   Pass the determined props (`currentDirection`, `currentNumber`, `clueText`) to `<ClueVisualiser />`.
    *   Render `<ClueVisualiser ... />` within `ThemedCrossword.tsx` (e.g., below the `CrosswordProvider`).
    *   **Style this component using `styled-components`**, consistent with the approach for `CrosswordCore`. Create basic styles for visibility.
*   **Test:** Run the app. Click grid cells that are part of defined clues. The text in the `ClueVisualiser` should update reactively to show the correct clue number, direction, and text based on the selected cell and direction state managed by `useGameStateManager`. Test clicking empty cells or cells not part of a clue in the current direction.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Displaying derived state reactively. Logic for finding the current clue number/text resides in the adapter (`ThemedCrossword`). Ensure styling is applied.
    ```

---

### Step 2.5: Implement Clue Click -> `useGameStateManager` Update
*   **Implementation:**
    *   In `src/GameFlow/state/useGameStateManager.ts`, add a new exported action function `handleClueSelect(direction, number)`. This function should:
        *   Access the `puzzleData` state within the hook.
        *   Find the clue entry in `puzzleData` that matches the provided `direction` and `number`.
        *   From that clue entry, get the starting `row` and `col`.
        *   Update the `selectedRow`, `selectedCol`, and `currentDirection` state using the respective `set` functions from `useState`.
    *   Modify `ClueVisualiser.tsx` to:
        *   Accept an `onClueClick` prop, typed as a function that takes `direction` and `number`.
        *   Make the displayed clue text wrapper (e.g., a `div`) clickable (`onClick` handler).
        *   When clicked, call the `onClueClick` prop, passing the currently displayed `currentDirection` and `currentNumber`.
    *   In `ThemedCrossword.tsx`, pass the `handleClueSelect` function (received via props from `useGameStateManager`) down to `<ClueVisualiser>` as the `onClueClick` prop.
*   **Test:** Run the app. Click on the displayed clue text in `ClueVisualiser`. Verify using React DevTools or console logs that the `selectedRow`, `selectedCol`, and `currentDirection` state in `useGameStateManager` updates correctly to the start of that clue. The focus highlight in the `CrosswordGrid` should visually move to the first cell of the clicked clue (this depends on `CrosswordProvider` correctly using focus info passed down).
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Completing the two-way binding between grid selection and clue display via the central hook. Relies on accurate data lookup and state updates.
    ```

---