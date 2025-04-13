# Prototype Implementation: Phase 2 - Interaction and Clue Display

**Goal:** Enable basic grid interaction (clicking cells, updating focus state), display the currently active clue, and allow clicking the clue to refocus the grid, all coordinated via the `useGameStateManager` hook and rendered within the basic layout scaffold.

**Prerequisite:** Phase 1.75 completed successfully. Basic application layout is in place, and the crossword grid renders visibly within the `CrosswordArea`. `useGameStateManager` provides puzzle data. Theme system is consolidated.

---

### Step 2.1: Introduce `ThemedCrossword` Wrapper
*   **Implementation:**
    *   Create `src/Crossword/components/ThemedCrossword.tsx`.
    *   This component will act as the primary bridge between the `useGameStateManager` hook and the `CrosswordCore` components (`CrosswordProvider`, `CrosswordGrid`).
    *   In `App.tsx`, call `useGameStateManager`.
    *   Modify `App.tsx`'s return statement: Instead of rendering `<CrosswordProvider>` directly inside `<CrosswordArea>`, render `<ThemedCrossword gameState={gameState} />` (where `gameState` is the object returned by `useGameStateManager`, potentially including state values and action functions).
    *   Inside `ThemedCrossword.tsx`, receive the `gameState` prop. Render `<CrosswordProvider>` and `<CrosswordGrid>` (or just pass `CrosswordGrid` as children to `Provider`), passing down the necessary props like `puzzleData`, `useStorage`, etc.
*   **Test:** Refactor `App.tsx` and implement the basic `ThemedCrossword`. Ensure the grid still renders correctly within the `CrosswordArea` via this new wrapper component.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Introduces an adapter layer for cleaner separation between App state logic and CrosswordCore implementation details. Grid rendering should be unaffected.
    ```

---

### Step 2.2: Add Focus/Selection State to `useGameStateManager`
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    *   Add new state variables using `useState` to track the currently selected cell (e.g., `selectedRow`, `selectedCol`) and the current input direction (`currentDirection: 'across' | 'down'`). Initialize appropriately (e.g., -1 or null for selection, 'across' for direction).
    *   Define and export functions from the hook to update this state (e.g., `handleCellSelect(row, col)`, `toggleDirection()`). These functions will use the `set` functions from `useState`.
    *   Return the new state values (`selectedRow`, `selectedCol`, `currentDirection`) and the new action functions (`handleCellSelect`, `toggleDirection`) from the hook's return object.
*   **Test:** In `App.tsx`, call the hook, destructure the new state/functions. Pass necessary functions down to `ThemedCrossword`. Temporarily add buttons inside `ThemedCrossword` or use `useEffect` hooks to call `handleCellSelect` or `toggleDirection`. Log the state values returned from the hook (e.g., logged in `App.tsx` or `ThemedCrossword`) to verify they update correctly in response to these calls.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Extending the hook with focus state and update logic. Actions are passed down to where they'll be needed.
    ```

---

### Step 2.3: Connect Grid Click -> `useGameStateManager` Update
*   **Implementation:**
    *   Modify `CrosswordProvider.tsx` to accept an `onCellClick(row, col)` prop (or identify an equivalent existing callback – **verify this callback exists in the old code and its exact signature**).
    *   In `ThemedCrossword.tsx`, receive the `handleCellSelect` function (originating from `useGameStateManager` via props passed from `App.tsx`) and pass it down to `<CrosswordProvider>` as the `onCellClick` prop (or the correctly named prop).
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
        *   Get the necessary state (`puzzleData`, `selectedRow`, `selectedCol`, `currentDirection`) from the `gameState` prop received from `App.tsx`.
        *   Implement logic to determine the `currentNumber` (for both 'across' and 'down' clues potentially associated with the `selectedRow`, `selectedCol`) and then look up the corresponding `clueText` from `puzzleData` based on the `currentDirection`. Handle edge cases where no cell is selected or the selected cell isn't part of a clue in the current direction (display placeholder text).
        *   Pass the determined props (`currentDirection`, `currentNumber`, `clueText`) to `<ClueVisualiser />`.
    *   Modify `App.tsx` to render `<ClueVisualiser ... />` within the `<ClueArea>` layout component. Pass the necessary data down from the hook (likely via `ThemedCrossword` or directly if simpler for now, though passing via `ThemedCrossword` keeps related logic together). **Decision:** For cleaner separation, pass relevant state (`currentDirection`, derived `currentNumber`, derived `clueText`) from `App.tsx` -> `ThemedCrossword` -> `ClueVisualiser`. Render `ClueVisualiser` within `ThemedCrossword` and have `ThemedCrossword` render its output within `App.tsx`'s `ClueArea`. **Revised Decision:** Simpler for prototype: `App.tsx` calls hook, calculates derived clue info, renders `ThemedCrossword` in `CrosswordArea`, renders `ClueVisualiser` in `ClueArea`, passing necessary props to both.
    *   **Style this component using `styled-components`**, consistent with the approach for `CrosswordCore`. Create basic styles for visibility within the `ClueArea`.
*   **Test:** Run the app. Click grid cells that are part of defined clues. The text in the `ClueVisualiser` (rendered in the `ClueArea`) should update reactively to show the correct clue number, direction, and text based on the selected cell and direction state managed by `useGameStateManager`. Test clicking empty cells or cells not part of a clue in the current direction.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Displaying derived state reactively in the correct layout area. Logic for deriving current clue info likely lives in App.tsx or ThemedCrossword for now. Ensure styling is applied. Using simpler prop flow (App -> ClueVisualiser directly) for prototype.
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
    *   In `App.tsx`, get the `handleClueSelect` function from `useGameStateManager` and pass it down as the `onClueClick` prop to `<ClueVisualiser />`.
*   **Test:** Run the app. Click on the displayed clue text in `ClueVisualiser`. Verify using React DevTools or console logs that the `selectedRow`, `selectedCol`, and `currentDirection` state in `useGameStateManager` updates correctly to the start of that clue. The focus highlight in the `CrosswordGrid` should visually move to the first cell of the clicked clue (this depends on `CrosswordProvider` correctly using focus info passed down - requires passing selection state from hook -> ThemedCrossword -> Provider).
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Completing the two-way binding between grid selection and clue display via the central hook. Relies on accurate data lookup and state updates. Requires wiring selection state down to CrosswordProvider.
    ```

---