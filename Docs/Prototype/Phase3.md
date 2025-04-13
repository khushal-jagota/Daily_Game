# Prototype Implementation: Phase 3 - Completion Logic and Input Blocking

**Goal:** Implement the logic for marking words as complete with a fixed color, passing this state down, and modifying the reused `CrosswordProvider` to block input based on this state.

**Prerequisite:** Phase 2 completed successfully. Basic grid interaction and clue display are working.

---

### Step 3.1: Implement `completeWord` in GSM (Fixed Color)

*   **Implementation:** In `GameStateManager.ts`:
    *   Implement the `completeWord(direction, number)` method. Define a constant `const FIXED_COLOR = '#DDDDDD';` (or similar visible grey/placeholder).
    *   Inside the method, create the `wordId = \`${number}-${direction}\``.
    *   Update the state: `this.state.completedWords = { ...this.state.completedWords, [wordId]: FIXED_COLOR };` (ensure immutability).
    *   Trigger the state notification mechanism.
*   **Test:** Manually call `gameStateManager.completeWord('across', '1')` from `App.tsx` (temporarily) and check via console logs or React DevTools that `state.completedWords` updates correctly with the wordId and fixed color.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 3.2: Connect `onAnswerCorrect` Callback

*   **Implementation:** In `ThemedCrossword.tsx`:
    *   Define a handler function `handleAnswerCorrect = (direction, number, answer) => { props.gameStateManager.completeWord(direction, number); }`. (Ensure you pass `gameStateManager` prop).
    *   Pass this handler down to the `<CrosswordProvider>` component using the correct prop name (`onAnswerCorrect` or `onCorrect` - check `CrosswordProvider.tsx` prop types and usage around line 430).
*   **Test:** Run the app. Correctly fill in a word in the grid by typing letters. Check logs/DevTools to ensure `GameStateManager.completeWord` was called and `state.completedWords` updated for that specific wordId.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 3.3: Pass Completion Color Down & Modify `Cell`

*   **Implementation:**
    *   **In `ThemedCrossword.tsx`:** Read `state.completedWords` from `gameStateManager`. Calculate a map `cellCompletionInfo: { [row_col: string]: { color: string } }`. To do this: iterate `Object.entries(state.completedWords)`, for each `[wordId, color]`, parse `wordId` to get `number` & `direction`, look up the clue info (`row`, `col`, `answer`.length) in `puzzleData`, then loop through the cells belonging to that word and add `{ color }` to the `cellCompletionInfo` map using `"R${r}C${c}"` as the key.
    *   **Modify `CrosswordProvider.tsx`:** Add an optional prop `cellCompletionInfo?: { [key: string]: { color: string } }`. Pass this prop down through the `CrosswordContext` value it provides.
    *   **Modify `CrosswordGrid.tsx`:** Consume `cellCompletionInfo` from `CrosswordContext`. In the loop rendering `Cell`s, retrieve the info for the current cell: `completionInfo={cellCompletionInfo?.[`R${row}C${col}`]}` and pass it as a prop to `<Cell>`.
    *   **Modify `Cell.tsx`:** Add the optional prop `completionInfo?: { color: string }`. In the `<rect>` element, modify the `fill` attribute logic: if `completionInfo?.color` exists, use that color value; otherwise, fall back to the existing focus/highlight/default background logic.
    *   **In `ThemedCrossword.tsx`:** Pass the calculated `cellCompletionInfo` map as the prop to `<CrosswordProvider>`.
*   **Test:** Run the app. Complete a word correctly. Verify the cells belonging to that word visually change to the `FIXED_COLOR`. Click on non-completed cells and completed cells – ensure focus/highlight styles still apply correctly *on top of* or *instead of* the completion color where appropriate (focus/highlight likely take precedence visually).
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 3.4: Implement Input Blocking in `CrosswordProvider`

*   **Implementation:**
    *   **Add Prop:** Define and add the `completedWordIds?: Set<string>` prop to `CrosswordProvider.tsx`'s props interface/PropTypes.
    *   **Modify Handlers:** In `CrosswordProvider.tsx`, specifically within `handleSingleCharacter` (around line 715) and `setCellCharacter` (around line 403):
        *   **Remove** the old `isCorrectInAnyDirection` block or the dynamic checks involving iterating through word cells.
        *   **Add:** Before processing input/setting state, get the target cell's data (`const cell = getCellData(row, col)`). Check if the cell is used (`if (!cell.used) return;`). Get the `across` and `down` clue numbers associated with the cell (`cell.across`, `cell.down`). Check if either word ID is present in the new prop: `if ( (cell.across && props.completedWordIds?.has(\`${cell.across}-across\`)) || (cell.down && props.completedWordIds?.has(\`${cell.down}-down\`)) ) { return; // Block }`.
    *   **In `ThemedCrossword.tsx`:** Read `state.completedWords` from `gameStateManager`. Create a `const completedWordIds = new Set(Object.keys(state.completedWords));`. Pass this `Set` as the `completedWordIds` prop to `<CrosswordProvider>`.
*   **Test:** Run the app. Complete a word correctly. Verify its cells change color. **Crucially, attempt to type letters into the cells of the completed word.** Confirm that the input is ignored (the character doesn't appear, and the guess state doesn't change). Focus might still move forward depending on the `moveForward()` calls remaining in the handler; this is acceptable for the prototype. Test on intersection cells where one word is complete but the other isn't – typing should still be blocked.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---