# Prototype Implementation: Phase 2 - Interaction and Clue Display

**Goal:** Enable basic grid interaction (clicking cells, updating focus state), display the currently active clue, and allow clicking the clue to refocus the grid.

**Prerequisite:** Phase 1 completed successfully.

---

### Step 2.1: Introduce `ThemedCrossword` Wrapper
*   **Implementation:** ... (No change) ...
*   **Test:** ... (No change) ...
*   **Check:** ... (No change) ...
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 2.2: Add Focus/Selection State to GSM
*   **Implementation:** ... (No change) ...
*   **Test:** ... (No change) ...
*   **Check:** ... (No change) ...
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 2.3: Connect Grid Click -> GSM Update
*   **Implementation:** ... (No change) ...
*   **Test:** ... (No change) ...
*   **Check:** ... (No change) ...
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 2.4: Implement & Render Basic `ClueVisualiser`
*   **Implementation:**
    *   Create `src/Crossword/components/ClueVisualiser.tsx`.
    *   Ensure `ThemedCrossword` and `ClueVisualiser` access state from `GameStateManager` (via props/context).
    *   `ClueVisualiser` needs `currentDirection`, `currentNumber`, `puzzleData` from GSM to look up clue text.
    *   Render the basic text: `"${number} ${direction}: ${clueText}"`. Handle empty number cases.
    *   **Style this component using `styled-components`**, consistent with the approach for `CrosswordCore`.
    *   Render `<ClueVisualiser ... />` within `App.tsx`.
*   **Test:** Run the app. Click grid cells. The text in the `ClueVisualiser` should update reactively.
*   **Check:**
    *   [ ] Code Completed
    *   [ ] Test Checked
*   **Notes:**
    ```
    [Your notes here]
    ```

---

### Step 2.5: Implement Clue Click -> GSM Update
*   **Implementation:** ... (No change) ...
*   **Test:** ... (No change) ...
*   **Check:** ... (No change) ...
*   **Notes:**
    ```
    [Your notes here]
    ```

---