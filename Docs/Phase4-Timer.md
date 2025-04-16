# Phase 4 Plan: Timer, Multi-Stage Completion & Visuals

**Document Version:** 1.0
**Date:** [Insert Date]

## Overall Goal

To integrate a user-initiated timer, implement multi-stage completion logic based on time thresholds (0-30s, 31-70s, 71-120s, 121-180s, >180s), provide distinct visual color feedback for each stage using placeholder colors (Blue, Green, Yellow, Orange, Red), display the timer, and ensure the system functions correctly through rigorous manual testing.

## Prerequisite Knowledge & Assets

1.  Completed Prototype codebase (Post-Phase 3 state).
2.  Defined Phase 4 Requirements:
    *   Start Trigger: "Start Game" button.
    *   Stage Timing: 0-30s (1), 31-70s (2), 71-120s (3), 121-180s (4), >180s (5).
    *   Stage Colors (Placeholders): Blue (`#2196F3`), Green (`#4CAF50`), Yellow (`#FFC107`), Orange (`#FF9800`), Red (`#F44336`).
    *   Timer Display: `MM:SS`, stops on completion, no pause.
3.  Established Manual Testing Checklist.
4.  Development environment configured.

---

## Phase 4 Breakdown

### Step 4.1: Define Stage Colors in Theme

*   **Status:** Not Started
*   **Scope:** Theme definition files (`CrosswordStyles.ts`, `styled.d.ts`).
*   **Reason:** Establish the placeholder background colors required for visual feedback in later steps. Ensure type safety for theme usage.
*   **Implementation:**
    1.  Edit `src/Crossword/styles/CrosswordStyles.ts`: Add `completionStage1Background` through `completionStage5Background` properties with their hex codes (`#2196F3`, `#4CAF50`, `#FFC107`, `#FF9800`, `#F44336`) within the `colors` object of the exported `crosswordTheme`.
    2.  Edit `src/styled.d.ts`: Update the `DefaultTheme` interface (likely within `colors`) to include definitions for `completionStage1Background: string;` through `completionStage5Background: string;`.
*   **Test:** Code review. Static analysis (TypeScript check). Run the app to ensure the theme provider still works and doesn't cause errors.
*   **Check:**
    *   [ ] Colors added to `crosswordTheme` in `CrosswordStyles.ts`.
    *   [ ] Theme type updated in `styled.d.ts`.
    *   [ ] Test Checked (Review, Static Analysis, App Run).
*   **Notes:**
    ```text
    Added placeholder color definitions for 5 completion stages to the theme object and its TypeScript definition. Uses #2196F3 (Blue), #4CAF50 (Green), #FFC107 (Yellow), #FF9800 (Orange), #F44336 (Red).
    ```

### Step 4.2: Implement "Start Game" Mechanism

*   **Status:** Not Started
*   **Scope:** Application root component (`App.tsx` or similar).
*   **Reason:** Implement the requirement for the timer/game to start only upon user interaction. Control game flow state.
*   **Implementation:**
    1.  In `App.tsx`, add state: `const [isGameStarted, setIsGameStarted] = useState(false);`.
    2.  Add a "Start Game" `<button>` component to the render output.
    3.  Attach an `onClick` handler to the button that calls `setIsGameStarted(true)`.
    4.  Wrap the main crossword component (`ThemedCrossword` or its container) and the `TimerDisplay` (to be added later) in conditional rendering logic based on `isGameStarted`. Consider if the grid should be visible but disabled/non-interactive before starting.
*   **Test:** Manual E2E: Verify button appears on load. Verify grid/timer area is hidden or disabled initially. Verify clicking the button sets `isGameStarted` to `true` (DevTools) and makes the grid/timer area visible/interactive.
*   **Check:**
    *   [ ] `isGameStarted` state added to `App.tsx`.
    *   [ ] "Start Game" button added and functional (`onClick`).
    *   [ ] Conditional rendering logic implemented for grid/timer area.
    *   [ ] Test Checked (Manual E2E, DevTools Inspection).
*   **Notes:**
    ```text
    Introduced `isGameStarted` state and a button in `App.tsx` to control the visibility/interactivity of the main game area, fulfilling the start trigger requirement.
    ```

### Step 4.3: Create `useTimer` Hook

*   **Status:** Not Started
*   **Scope:** New hook file `src/Timer/hooks/useTimer.ts`.
*   **Reason:** Encapsulate timer counting and stage calculation logic based on defined requirements.
*   **Implementation:**
    1.  Create the file `src/Timer/hooks/useTimer.ts`.
    2.  Define the hook `useTimer({ isGameActive: boolean })`.
    3.  Implement internal state for `startTime: number | null`, `elapsedTime: number`.
    4.  Use `useEffect` to:
        *   Record `startTime` (e.g., `Date.now()`) only when `isGameActive` first becomes true.
        *   Set up `setInterval` to update `elapsedTime` every second *only* when `isGameActive` is true.
        *   Clear interval on cleanup or when `isGameActive` becomes false.
    5.  Create internal helper `calculateStage(elapsedTime: number): number` implementing the 30s/70s/120s/180s logic (return 1 for <=30, 2 for <=70, 3 for <=120, 4 for <=180, 5 for >180). Handle `elapsedTime <= 0` returning 0 or appropriate initial stage.
    6.  Return `{ elapsedTime, currentStage: calculateStage(elapsedTime) }`.
*   **Test:** Code review. Initial manual verification by temporarily calling the hook in `App.tsx` (after Step 4.2) and logging its output (`elapsedTime`, `currentStage`) to the console when `isGameActive` is true. Verify seconds increment and stage changes correctly at thresholds (30s, 70s, 120s, 180s).
*   **Check:**
    *   [ ] Hook file created.
    *   [ ] Hook accepts `isGameActive` prop.
    *   [ ] `startTime`, `elapsedTime` state implemented.
    *   [ ] `useEffect` correctly manages interval based on `isGameActive`.
    *   [ ] `calculateStage` helper implemented with correct thresholds (30/70/120/180s).
    *   [ ] Hook returns `elapsedTime` and `currentStage`.
    *   [ ] Test Checked (Review, Temporary Logging).
*   **Notes:**
    ```text
    Created `useTimer` hook encapsulating time tracking and stage calculation (30/70/120/180s thresholds). Requires `isGameActive` prop. Initial validation via logging.
    ```

### Step 4.4: Refactor `useGameStateManager` State (Set -> Map)

*   **Status:** Not Started
*   **Scope:** `src/GameFlow/state/useGameStateManager.ts`.
*   **Reason:** Modify the state structure to allow storage of completion stages alongside completed word IDs. Prerequisite for recording stage data.
*   **Implementation:**
    1.  Change `completedWords` state definition from `useState<Set<string>>` to `useState<Map<string, { stage: number }>>(new Map())`.
    2.  Update all internal reads: change checks like `completedWords.has(wordId)` to continue working with the Map keys.
    3.  Update all internal writes: temporary simple write `setCompletedWords(prev => new Map(prev).set(wordId, { stage: 0 }));` just to satisfy the type change for now (stage logic comes next). Will likely be inside the completion `useEffect`.
    4.  Ensure dependent logic like `isEditableCell` correctly checks `completedWords.has(wordId)`.
*   **Test:** **Rigorous Manual Testing Checklist**. Focus heavily on:
    *   Can words still be completed? (Check visually and via DevTools seeing `{ stage: 0 }` entries in the Map).
    *   Does Strict Locking (`INP-05`, `DEL-04`) still work based on the Map keys?
    *   Do completion-dependent UI elements (if any exist beyond basic color) still work?
*   **Check:**
    *   [ ] `completedWords` state type changed to `Map`.
    *   [ ] Internal reads updated (`.has`).
    *   [ ] Internal writes updated (`.set` with placeholder stage).
    *   [ ] `isEditableCell` logic confirmed correct for Map.
    *   [ ] Test Checked (Rigorous Manual Checklist, DevTools state inspection).
*   **Notes:**
    ```text
    Refactored `completedWords` state from Set to Map<string, { stage: number }>. Temporarily setting stage to 0 on completion. Validated core completion and locking via manual testing.
    ```

### Step 4.5: Integrate Timer Stage into `useGameStateManager`

*   **Status:** Not Started
*   **Scope:** `App.tsx`, `src/GameFlow/state/useGameStateManager.ts`.
*   **Reason:** Connect the timer's calculated stage to the game state logic so the correct stage is recorded upon word completion. Determine overall game completion.
*   **Implementation:**
    1.  In `App.tsx`: Call `useTimer({ isGameActive: isGameStarted && !isGameComplete });`. Get `elapsedTime`, `currentStage`. Call `useGameStateManager`.
    2.  Determine how to pass `currentStage` to the hook. Preferred: Modify relevant actions (e.g., `handleGuessInput`) in `useGameStateManager` to accept `currentStage` as an argument. Pass it from `App.tsx`.
    3.  In `useGameStateManager`: Modify the `useEffect` checking for word completion. When word `wordId` is completed, use the received `currentStage` value in the `setCompletedWords` call: `setCompletedWords(prev => new Map(prev).set(wordId, { stage: currentStage }));`.
    4.  In `useGameStateManager`: Calculate `isGameComplete` state (e.g., `completedWords.size === totalNumberOfWordsInPuzzle`). Return `isGameComplete`.
    5.  In `App.tsx`: Use the returned `isGameComplete` to correctly calculate `isGameActive` for the `useTimer` prop.
*   **Test:** **Rigorous Manual Testing Checklist**. Focus heavily on:
    *   Completing words at different times (before 30s, 31-70s, 71-120s, 121-180s, >180s).
    *   Inspecting `completedWords` state in DevTools to verify the **correct stage number** (1, 2, 3, 4, 5) is stored based on completion time.
    *   Verify timer stops exactly when `isGameComplete` becomes true.
    *   Verify no regressions in other functionality.
*   **Check:**
    *   [ ] `App.tsx` calls both hooks and passes state/props (`isGameActive`, `currentStage`).
    *   [ ] `useGameStateManager` action(s) accept `currentStage`.
    *   [ ] Completion `useEffect` uses `currentStage` when setting state.
    *   [ ] `isGameComplete` calculated and returned.
    *   [ ] Timer stops correctly on game completion.
    *   [ ] Test Checked (Rigorous Manual Checklist, DevTools stage inspection).
*   **Notes:**
    ```text
    Integrated `useTimer` with `useGameStateManager`. Stage based on completion time is now correctly recorded in the `completedWords` Map. Game completion state correctly stops the timer. Verified stages via DevTools.
    ```

### Step 4.6: Implement and Integrate `TimerDisplay` Component

*   **Status:** Not Started
*   **Scope:** New component `src/Timer/components/TimerDisplay.tsx`, `App.tsx`/Layout file.
*   **Reason:** Provide visual feedback of the elapsed time to the user as required.
*   **Implementation:**
    1.  Create `src/Timer/components/TimerDisplay.tsx`.
    2.  Define a styled component that accepts `elapsedTime: number` prop.
    3.  Implement logic inside the component to format `elapsedTime` into `MM:SS` string (handle padding zeros).
    4.  Use `styled-components` for visual appearance.
    5.  In `App.tsx` (or relevant Layout component): Import and render `<TimerDisplay elapsedTime={elapsedTime} />`, ensuring it's only rendered when `isGameStarted` is true. Pass `elapsedTime` from `useTimer`.
*   **Test:** Manual E2E: Verify timer display appears only after "Start Game". Verify it shows `00:00` initially and increments correctly each second in `MM:SS` format. Verify it stops updating when the game is complete. Check visual styling.
*   **Check:**
    *   [ ] `TimerDisplay.tsx` component created.
    *   [ ] Time formatting logic (MM:SS) implemented correctly.
    *   [ ] Component styled using `styled-components`.
    *   [ ] Component integrated into layout, receives `elapsedTime`.
    *   [ ] Conditional rendering based on `isGameStarted` implemented.
    *   [ ] Test Checked (Manual E2E).
*   **Notes:**
    ```text
    Created and integrated the `TimerDisplay` component. It correctly formats and displays the elapsed time, starting/stopping based on game state.
    ```

### Step 4.7: Propagate Stage Data for Cell Styling

*   **Status:** Not Started
*   **Scope:** `ThemedCrossword.tsx`, `CrosswordProvider.tsx`, `context.ts`.
*   **Reason:** Make the specific completion stage (`1-5`) for each cell available to the `Cell` component for styling. Adapt existing propagation logic for the new Map structure.
*   **Implementation:**
    1.  In `ThemedCrossword.tsx`: Read the `completedWords: Map<string, { stage: number }>` from `useGameStateManager`.
    2.  Calculate a new map, `cellCompletionStatus: Map<cellKey, { stage: number } | null>`. Iterate through `completedWords`. For each completed word, find its cells and add entries `[cellKey, { stage: wordStage }]` to `cellCompletionStatus`.
    3.  Update the `CrosswordContextType` (`context.ts`) to expect `cellCompletionStatus?: Map<string, { stage: number } | null>`.
    4.  Update `CrosswordProviderProps` and `PropTypes` in `CrosswordProvider.tsx` to accept the new map type.
    5.  Update the context value provided by `CrosswordProvider` to include the new `cellCompletionStatus` map. Update `useMemo` dependencies if applicable.
*   **Test:** Code review. Static Analysis (TS). DevTools E2E Inspection: After completing words at different stages, inspect the `cellCompletionStatus` prop/context value. Verify it's a Map where keys are `cellKeys` and values are `{ stage: number }` objects corresponding to the correct stage, or `null` for incomplete cells.
*   **Check:**
    *   [ ] `cellCompletionStatus` map calculation logic added in `ThemedCrossword`.
    *   [ ] Context Type Updated (`context.ts`) for new Map structure.
    *   [ ] Provider Props/PropTypes Updated (`CrosswordProvider.tsx`).
    *   [ ] Context Value Updated (`CrosswordProvider.tsx`).
    *   [ ] Test Checked (Review, Static Analysis, E2E DevTools Inspection).
*   **Notes:**
    ```text
    Updated data propagation logic (`ThemedCrossword`, `CrosswordProvider`, context) to pass down a map indicating the specific completion stage for each relevant cell key.
    ```

### Step 4.8: Apply Stage Colors in Cell Component

*   **Status:** Not Started
*   **Scope:** `src/Crossword/components/Cell.tsx`.
*   **Reason:** Implement the final visual requirement: coloring cell backgrounds based on their completion stage using the defined theme colors.
*   **Implementation:**
    1.  Consume the `cellCompletionStatus` map from context (likely via `useContext(CrosswordContext)`).
    2.  Determine the stage for the current cell: `const status = cellCompletionStatus?.get(getCellKey(props.row, props.col)); const stage = status?.stage;`.
    3.  In the `styled-components` definition for the cell:
        *   Implement logic (e.g., a helper function `getBackgroundColor(theme, stage, isFocused, isHighlighted)`) that determines the final background color.
        *   This function should use a `switch(stage)` or similar:
            *   `case 1: return theme.colors.completionStage1Background;`
            *   `case 2: return theme.colors.completionStage2Background;`
            *   ... etc. for 3, 4, 5.
            *   `default:` return focus/highlight/default color based on other props.
        *   Ensure completion stage colors have higher precedence than default/focus/highlight.
*   **Test:** **Rigorous Manual E2E**. Complete words ensuring they fall into different time brackets (Stage 1, 2, 3, 4, 5).
    *   Verify the correct background color (Blue, Green, Yellow, Orange, Red) appears immediately upon completion for the cells of that word.
    *   Verify colors persist correctly.
    *   Verify focus/highlight styles still work correctly on *incomplete* cells and don't override completion colors.
*   **Check:**
    *   [ ] Stage data consumed from context.
    *   [ ] Styling logic implemented in `styled-components` to select color based on stage.
    *   [ ] Correct placeholder colors applied for stages 1-5.
    *   [ ] Style precedence logic is correct (completion > focus/highlight > default).
    *   [ ] Test Checked (Rigorous Manual E2E).
*   **Notes:**
    ```text
    Updated `Cell.tsx` to consume completion stage data and apply the corresponding background color from the theme. Verified correct colors appear based on timed completion via manual E2E testing.
    ```

---

## Future Considerations & Architectural Fitness

Based on discussions during planning, the architecture established in this phase is confirmed to be suitable for potential future enhancements without major refactoring:

*   **Stage Countdown Bar:** The `useTimer` hook can be extended to return stage start/end times. A new UI component can consume this data along with `elapsedTime` and `currentStage` to calculate and render a progress bar representing time elapsed within the current stage.
*   **Dynamic Coloring:** Both the existing `TimerDisplay` and the potential `StageCountdownBar` can easily have their colors (text, background) dynamically set based on the `currentStage` prop, using standard `styled-components` theming practices.
*   **Animations:** The mechanism of stage data propagating to the `Cell` component provides a standard hook for triggering CSS Transitions, CSS Animations, or JavaScript animation libraries upon cell completion, allowing for smooth color change effects later.

## Concluding Remarks

Phase 4 focuses on implementing the core timer and multi-stage completion mechanics, which are central to the game's unique identity. By the end of this phase, we will have a functional timer, state logic correctly recording completion stages based on time, and immediate visual feedback via distinct cell colors for each stage. While deferring automated testing requires increased vigilance in manual testing, successfully completing this phase will provide a solid foundation with validated architectural patterns for subsequent features like scoring, sharing, and dynamic puzzle loading. The emphasis remains on clear requirements, structured implementation, and meticulous manual validation.