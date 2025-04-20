**Questions about Our Codebase:**

To create a precise integration plan and avoid conflicts, please clarify the following about our *current* implementation:

1.  **`KeyboardArea` Styling:** What are the exact CSS properties currently applied to the `KeyboardArea` styled-component in `src/Layout/components.ts`? Specifically, what are its `min-height` (from `minmax(clamp(...))`), `padding`, `background-color`, `display`, and `align-items`/`justify-content` properties, if any? This determines the container the keyboard will live in.

**Answer:** The `KeyboardArea` styled-component in `src/Layout/components.ts` has the following properties:
- `padding`: 1rem
- `min-height`: 8rem
- `background-color`: Uses theme.gridBackground or fallback '#EEE'
- `display`: flex
- `justify-content`: center
- `align-items`: center
- `overflow`: hidden

2.  **Theme Variables:** Which specific theme variables (defined in `src/Crossword/styles/CrosswordStyles.ts` or `styled.d.ts`) should be used for:
    *   Keyboard background color?
    *   Default key background color?
    *   Default key text color?
    *   Special key background/text color (e.g., Backspace, Enter - if we add one)?
    *   Key border color/radius?
    *   Key font size/family?

**Answer:** Based on the theme system in `src/Crossword/styles/CrosswordStyles.ts` and `styled.d.ts`, these variables should be used:
- **Keyboard background color**: `gridBackground` (currently '#fffaf0')
- **Default key background color**: `cellBackground` (currently '#fffaf0')
- **Default key text color**: `textColor` (currently '#2c3e50')
- **Special key background/text color**: No specific variable exists, but could use `highlightBackground` (currently '#f5f9ff') for background and `textColor` for text
- **Key border color**: `cellBorder` (currently '#dde1e4')
- **Key border radius**: No specific variable, would need to match design system
- **Key font size/family**: No specific variable defined, should match application typography

3.  **`useGameStateManager` Input API:**
    *   What is the exact function signature within `useGameStateManager` (or its returned actions) that should be called to process a letter input for the currently active cell? (e.g., `handleLetterInput(letter: string)`).
    *   What is the function signature to handle a Backspace action? (e.g., `handleBackspace()`).
    *   Does the state manager currently track the "active" or "focused" cell coordinates? How is this information accessed or updated?

**Answer:** 
- **Letter input function**: `handleGuessInput(row: number, col: number, char: string, currentStage: number = 0)` - This allows entering a letter at a specific cell position.
- **Backspace function**: `handleBackspace()` - This clears the current cell if editable and moves to the previous cell.
- **Active cell tracking**: Yes, the state manager tracks the active cell coordinates through state variables:
  - `selectedRow` and `selectedCol` (current position)
  - `currentDirection` ('across' or 'down')
  - `currentNumber` (the clue number)
  - These are updated via `updateSelectionState(row, col, direction, number)` internally.

4.  **`ThemedCrossword` Interaction:**
    *   How does user input (currently, presumably physical keyboard events if any are handled) get passed from `App.tsx` or `ThemedCrossword.tsx` down into the `CrosswordCore` component or `useGameStateManager`? Is there an existing handler function we should reuse or adapt?
    *   How is focus currently managed *within* the crossword grid (`CrosswordCore`)? Does clicking a cell set focus? Does typing move focus? We need to ensure the virtual keyboard doesn't break this.

**Answer:**
- **Input handling flow**: 
  - Keyboard input is captured by an `<input>` element in `CrosswordGrid.tsx` using `onKeyDown={handleInputKeyDown}`
  - `handleInputKeyDown` in `CrosswordProvider.tsx` processes the key event and calls appropriate callbacks:
    - Letter keys call `handleSingleCharacter` which ultimately calls `onGuessAttempt` prop
    - `onGuessAttempt` is connected to `gameState.handleGuessInput` in `ThemedCrossword.tsx`
  - The flow is: Keyboard → Input → CrosswordProvider → ThemedCrossword → useGameStateManager

- **Focus management**:
  - Focus is managed using a hidden input element
  - Clicking a cell selects it and sets focus via `handleCellClick`
  - Typing a letter advances focus to the next cell in the current direction
  - Arrow keys move focus via `handleInputKeyDown`
  - The `focus()` function is called after state updates to maintain focus on the hidden input

5.  **Existing Keyboard Event Listeners:** Are there *any* global or component-level event listeners already set up for `keydown`, `keyup`, or `keypress` events anywhere in the application (e.g., in `App.tsx`, `ThemedCrossword.tsx`, or even `useGameStateManager`)? We need to avoid conflicts.

**Answer:** 
- There is a `keydown` event listener on the hidden input element in `CrosswordGrid.tsx` (line 189: `onKeyDown={handleInputKeyDown}`)
- The `handleInputKeyDown` function in `CrosswordProvider.tsx` handles:
  - Arrow keys (for navigation)
  - Space/Tab (for toggling direction)
  - Backspace/Delete
  - Home/End keys
  - Letter keys (a-zA-Z)
- No global event listeners were found in `App.tsx` or `useGameStateManager`
- No `keyup` or `keypress` events were found
- The virtual keyboard implementation should coordinate with this existing system, particularly by either using the same input element or ensuring proper focus management.

Answering these questions will give us the necessary context about the target container, styling system, state management interface, and existing interaction patterns, allowing for a much smoother integration plan for `react-simple-keyboard`.