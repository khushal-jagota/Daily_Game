# Prototype Implementation: Phase 3 - Completion Logic and Input Blocking

**Goal:** Implement the logic for marking words as complete with a fixed color, passing this state down, and modifying the reused `CrosswordProvider` to block input based on this state, managed via the `useGameStateManager` hook.

**Prerequisite:** Phase 2 completed successfully. Basic grid interaction and clue display are working, coordinated by `useGameStateManager`.

---

### Step 3.1: Implement `completeWord` in `useGameStateManager` (Fixed Color)

*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    *   Define a constant within the hook or globally accessible: `const FIXED_COLOR = '#DDDDDD';` (or similar visible grey/placeholder).
    *   Retrieve the `setCompletedWords` function from the `useState` initialized in Phase 1 for `completedWords`.
    *   Define and export an action function `completeWord(direction, number)` from the hook's return object.
    *   Inside this `completeWord` function:
        *   Construct the unique `wordId` string (e.g., `wordId = \`${number}-${direction}\``).
        *   Call the `setCompletedWords` state setter function, using the functional update form to ensure immutability: `setCompletedWords(prevCompletedWords => ({ ...prevCompletedWords, [wordId]: FIXED_COLOR }));`.
    *   Ensure the `completedWords` state value itself is also returned from the `useGameStateManager` hook.
*   **Test:** In `App.tsx` or `ThemedCrossword.tsx`, call the `useGameStateManager` hook. Destructure both `completeWord` and `completedWords` from its return value. Temporarily add a button or `useEffect` hook to call `completeWord('across', '1')` (using a valid clue number from your test data). Check via console logs or React DevTools that the `completedWords` state object returned by the hook updates correctly, containing the new `wordId` mapped to the `FIXED_COLOR`.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Adding word completion logic and state to the central hook. Using functional update for setCompletedWords ensures safe state updates based on the previous state. Ensure completedWords state is returned.
    ```

---

### Step 3.2: Connect `onAnswerCorrect` Callback

*   **Implementation:** In `ThemedCrossword.tsx`:
    *   Receive the `completeWord` action function via props (originating from `useGameStateManager`).
    *   Define a handler function `handleAnswerCorrect = (direction, number, answer) => { completeWord(direction, number); }`. To ensure this function has a stable identity across renders (important if passed as a prop to memoized components), wrap it in `useCallback`: `const handleAnswerCorrect = useCallback((direction, number, answer) => { completeWord(direction, number); }, [completeWord]);`. List `completeWord` in the dependency array.
    *   Pass this `handleAnswerCorrect` handler down to the `<CrosswordProvider>` component. **Critically: Verify the exact prop name expected by `CrosswordProvider`** for reporting a correct answer (it might be `onCorrect`, `onAnswer`, `onWordCorrect`, etc. - check its `propTypes` or implementation around line 430 of the original code). Use that exact prop name: `<CrosswordProvider onCorrect={handleAnswerCorrect} ... />`.
*   **Test:** Run the app. Correctly fill in a word in the grid by typing letters. Observe the console logs or use React DevTools to ensure the `handleAnswerCorrect` function in `ThemedCrossword` is called, which in turn should call the `completeWord` function provided by `useGameStateManager`. Verify that the `completedWords` state within the hook updates correctly for that specific wordId.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Connecting the CrosswordProvider's success callback to the central state hook's action. Using useCallback ensures handler stability. Verification of the CrosswordProvider prop name is crucial.
    ```

---

### Step 3.3: Pass Completion Color Down & Modify `Cell`

*   **Implementation:**
    *   **In `ThemedCrossword.tsx`:**
        *   Receive `completedWords` and `puzzleData` via props (originating from `useGameStateManager`).
        *   Use React's `useMemo` hook to calculate the `cellCompletionInfo` map: `const cellCompletionInfo = useMemo(() => { ... }, [completedWords, puzzleData]);`.
        *   The calculation logic inside `useMemo` remains: Initialize an empty object `info = {}`. Iterate through `Object.entries(completedWords)`. For each `[wordId, color]`: parse the `wordId` to get `number` and `direction`. Look up the clue's `row`, `col`, and `answer` length in `puzzleData`. Loop from `0` to `answer.length - 1`. Calculate the cell coordinates `(r, c)` for each letter based on direction. Generate the key `cellKey = \`R\${r}C\${c}\``. Add the entry `info[cellKey] = { color }` to the map. Finally, return the `info` object from the `useMemo` callback.
    *   **Modify `CrosswordProvider.tsx`:**
        *   Add a new optional prop to its interface/PropTypes: `cellCompletionInfo?: { [key: string]: { color: string } }`.
        *   Locate where `CrosswordProvider` creates its internal React Context value. Add the received `cellCompletionInfo` prop to this context value object so consuming components can access it.
    *   **Modify `CrosswordGrid.tsx`:**
        *   Use `useContext` to consume the `CrosswordContext` provided by `CrosswordProvider`.
        *   Extract the `cellCompletionInfo` object from the context value.
        *   Inside the loop where `<Cell>` components are rendered, generate the key for the current cell: `cellKey = \`R\${row}C\${col}\``.
        *   Retrieve the specific completion info for this cell: `completionInfo = cellCompletionInfo?.[cellKey]`.
        *   Pass this `completionInfo` down as a prop to the `<Cell>` component: `<Cell ... completionInfo={completionInfo} />`.
    *   **Modify `Cell.tsx`:**
        *   Add the optional prop to its interface/PropTypes: `completionInfo?: { color: string }`.
        *   Locate the SVG `<rect>` element that represents the cell background.
        *   Modify its `fill` attribute logic: Check if `props.completionInfo?.color` exists. If it does, use this color value as the `fill`. If not, fall back to the existing logic that determines the fill based on focus, highlight, or default background color. (The exact implementation depends on how `fill` is currently set - it might involve conditional logic or merging style objects).
    *   **In `ThemedCrossword.tsx`:** Ensure you pass the calculated `cellCompletionInfo` map (from `useMemo`) as the `cellCompletionInfo` prop to `<CrosswordProvider>`.
*   **Test:** Run the app. Complete a word correctly by typing. Verify the cells belonging only to that word visually change background color to the `FIXED_COLOR`. Click on non-completed cells, completed cells, and intersection cells. Ensure focus/highlight styles still apply correctly (they likely should visually override the completion color when active, but the completion color should be visible when the cell is not focused/highlighted).
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Propagating completion visual state down through context and props. `useMemo` optimizes the potentially expensive calculation. Requires careful modification of reused components (`CrosswordProvider`, `CrosswordGrid`, `Cell`) and understanding their existing styling/rendering logic.
    ```

---

### Step 3.4: Implement Input Blocking in `CrosswordProvider`

*   **Implementation:**
    *   **Add Prop:** Define and add a new optional prop `completedWordIds?: Set<string>` to `CrosswordProvider.tsx`'s props interface/PropTypes. Using a `Set` allows for efficient checking (`.has()`).
    *   **Modify Handlers:** Locate the input handling logic within `CrosswordProvider.tsx`. This is likely in functions like `handleSingleCharacter` (handling keyboard input, potentially around line 715) and/or `setCellCharacter` (a lower-level function to update cell state, potentially around line 403).
        *   **Inside these handlers, near the beginning:** Before proceeding with updating the cell's character or guess state:
            *   Get the target cell's coordinates (`row`, `col`).
            *   Retrieve the cell's data, which should include which clues pass through it (e.g., `const cell = getCellData(row, col);`). Ensure this utility function or equivalent exists and provides `cell.across` and `cell.down` clue numbers.
            *   Check if the cell is actually used in the puzzle: `if (!cell.used) return;`.
            *   Construct the potential word IDs for this cell: `acrossId = \`${cell.across}-across\`` and `downId = \`${cell.down}-down\``.
            *   Check if *either* of the words passing through this cell is marked as complete using the new prop: `if ( (cell.across && props.completedWordIds?.has(acrossId)) || (cell.down && props.completedWordIds?.has(downId)) ) { return; // Stop processing input for this cell }`.
        *   **Remove Conflicting Logic:** Carefully review the existing input handling logic and **remove or disable** any *previous* mechanisms for checking correctness or blocking input that are now redundant (e.g., the old `isCorrectInAnyDirection` checks mentioned in the original plan, or other checks that might dynamically evaluate if a word is complete based on its current letters). The *only* check for blocking input on completed words should be the new `props.completedWordIds` check.
    *   **In `ThemedCrossword.tsx`:**
        *   Receive the `completedWords` state object via props (originating from `useGameStateManager`).
        *   Use `useMemo` to create the `Set` of completed word IDs: `const completedWordIds = useMemo(() => new Set(Object.keys(completedWords)), [completedWords]);`. This ensures the `Set` is only recreated when `completedWords` actually changes.
        *   Pass this `completedWordIds` `Set` down as the `completedWordIds` prop to `<CrosswordProvider>`.
*   **Test:** Run the app. Complete a word correctly. Verify its cells change color as per Step 3.3. **Crucially, attempt to type letters into any cell belonging to the completed word.** Confirm that the input is ignored – the character should not appear in the cell, and the internal guess state of `CrosswordProvider` should not change for that cell. Focus might still move forward if `moveForward()` calls remain; this is acceptable if input itself is blocked. Test intersection cells: if a cell belongs to one completed word and one incomplete word, typing should still be blocked. Test typing in incomplete words to ensure that still works.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    Implementing the core input blocking logic by passing a simple Set of completed IDs to the reused component. `useMemo` optimizes Set creation. Requires careful modification and cleanup of the reused component's input handlers to rely solely on this new mechanism for blocking completed words.
    ```

---