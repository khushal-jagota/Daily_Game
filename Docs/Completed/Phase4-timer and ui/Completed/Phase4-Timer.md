# Phase 4 Plan: Timer, Multi-Stage Completion & Visuals (Refined)

**Document Version:** 1.1
**Date:** [Insert Date]

## Overall Goal

To integrate a user-initiated timer, implement multi-stage completion logic based on time thresholds (0-30s, 31-70s, 71-120s, 121-180s, >180s), provide distinct visual color feedback for each stage using placeholder colors (Blue, Green, Yellow, Orange, Red), display the timer, and ensure the system functions correctly through rigorous manual testing.

## Prerequisite Knowledge & Assets

1.  Completed Prototype codebase (Post-Phase 3 state), including provided files: `useGameStateManager.ts`, `App.tsx`, `ThemedCrossword.tsx`, `Cell.tsx`.
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

*   **Status:** Completed
*   **Scope:** Theme definition files (`CrosswordStyles.ts`, `styled.d.ts`).
*   **Reason:** Establish the placeholder background colors required for visual feedback in later steps. Ensure type safety for theme usage.
*   **Implementation:**
    1.  Edit `src/Crossword/styles/CrosswordStyles.ts`: Add `completionStage1Background` through `completionStage5Background` properties with their hex codes (`#2196F3`, `#4CAF50`, `#FFC107`, `#FF9800`, `#F44336`) within the `colors` object of the exported `crosswordTheme`.
    2.  Edit `src/styled.d.ts`: Update the `DefaultTheme` interface (likely within `colors`) to include definitions for `completionStage1Background: string;` through `completionStage5Background: string;`.
*   **Test:** Code review. Static analysis (TypeScript check). Run the app to ensure the theme provider still works and doesn't cause errors.
*   **Check:**
    *   [x] Colors added to `crosswordTheme` in `CrosswordStyles.ts`.
    *   [x] Theme type updated in `styled.d.ts`.
    *   [x] Test Checked (Review, Static Analysis, App Run).
*   **Notes:**
    ```text
    Added placeholder color definitions for 5 completion stages to the theme object and its TypeScript definition. Uses #2196F3 (Blue), #4CAF50 (Green), #FFC107 (Yellow), #FF9800 (Orange), #F44336 (Red).
    ```

### Step 4.1.5: Refactor Theme Type Definition Location

*   **Status:** Completed
*   **Scope:** Global theme type declaration (`src/styled.d.ts`), original theme type definition file (e.g., `src/Crossword/types/theme.ts`).
*   **Reason:** Improve structural clarity by aligning with convention (defining the full `DefaultTheme` augmentation directly in `styled.d.ts`). Decouple the global type declaration from specific feature file structures. Enhance maintainability and discoverability.
*   **Implementation:**
    1.  Identify the file currently exporting the `CrosswordTheme` interface (e.g., `src/Crossword/types/theme.ts`).
    2.  Copy the entire `CrosswordTheme` interface definition (including all properties).
    3.  Open `src/styled.d.ts`.
    4.  Paste the copied interface definition directly into `src/styled.d.ts`. You can rename it (e.g., `AppTheme`) or keep the name `CrosswordTheme`.
    5.  Modify the `declare module 'styled-components'` block to directly extend the pasted interface: `export interface DefaultTheme extends AppTheme { /* <--- use the pasted interface name */ }`.
    6.  Remove the `import { CrosswordTheme } from './Crossword/types';` line (or similar) from the top of `src/styled.d.ts`.
    7.  If the original theme type definition file (e.g., `src/Crossword/types/theme.ts`) is now empty or no longer needed, delete it.
*   **Test:** Code review. Static analysis (TypeScript check should pass globally). Run the application (`npm run dev` or similar) to ensure it loads without type errors related to the theme and that theme values are still accessible correctly where used (though none are used yet).
*   **Check:**
    *   [x] Full theme interface definition moved to `src/styled.d.ts`.
    *   [x] `DefaultTheme` augmentation in `src/styled.d.ts` uses the locally defined interface.
    *   [x] Old import removed from `src/styled.d.ts`.
    *   [x] Original theme type file potentially deleted.
    *   [x] Test Checked (Review, Static Analysis, App Run).
*   **Notes:**
    ```text
    Moved CrosswordTheme interface from src/Crossword/types/theme.ts to src/styled.d.ts and renamed it to AppTheme. Updated DefaultTheme to extend AppTheme directly. Removed the export from src/Crossword/types/index.ts and deleted the now-redundant theme.ts file. Updated CrosswordProvider.tsx to remove the unnecessary import. Application runs successfully with theme definitions now centralized in styled.d.ts.
    ```

### Step 4.2: Implement "Start Game" Mechanism

*   **Status:** Completed
*   **Scope:** Application root component (`App.tsx`).
*   **Reason:** Implement the requirement for the timer/game to start only upon user interaction. Control game flow state.
*   **Implementation:**
    1.  In `App.tsx`, add state: `const [isGameStarted, setIsGameStarted] = useState(false);`.
    2.  Add a "Start Game" `<button>` component to the render output.
    3.  Attach an `onClick` handler to the button that calls `setIsGameStarted(true)`.
    4.  Wrap the main crossword component (`ThemedCrossword` or its container) and the `TimerDisplay` (to be added later) in conditional rendering logic based on `isGameStarted`. Ensure grid is non-interactive before start.
*   **Test:** Manual E2E: Verify button appears on load. Verify grid/timer area is hidden or disabled initially. Verify clicking the button sets `isGameStarted` to `true` (DevTools) and makes the grid/timer area visible/interactive.
*   **Check:**
    *   [x] `isGameStarted` state added to `App.tsx`.
    *   [x] "Start Game" button added and functional (`onClick`).
    *   [x] Conditional rendering logic implemented for grid/timer area.
    *   [x] Test Checked (Manual E2E, DevTools Inspection).
*   **Notes:**
    ```text
    Implemented a Start Game button with styled-components for visual appeal. Created an initial welcome screen that explains the game concept to users. Added conditional rendering to show either the welcome screen with the Start Game button or the crossword game components based on the isGameStarted state. The crossword grid remains non-interactive until the game is started, fulfilling the requirement for user-initiated game start.
    ```

### Step 4.3: Create `useTimer` Hook

*   **Status:** Completed
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
    *   [x] Hook file created.
    *   [x] Hook accepts `isGameActive` prop.
    *   [x] `startTime`, `elapsedTime` state implemented.
    *   [x] `useEffect` correctly manages interval based on `isGameActive`.
    *   [x] `calculateStage` helper implemented with correct thresholds (30/70/120/180s).
    *   [x] Hook returns `elapsedTime` and `currentStage`.
    *   [x] Test Checked (Review, Temporary Logging).
*   **Notes:**
    ```text
    Implemented a reusable useTimer hook that accurately tracks elapsed time and calculates game stages based on time thresholds. The hook initializes timing when isGameActive becomes true, updates the elapsed time every second, and cleans up on unmount or state change. The calculateStage function correctly evaluates elapsed time against the required thresholds (30s, 70s, 120s, 180s) and returns the appropriate stage number. Tested by temporarily integrating with App.tsx and confirming the timer increments properly and stages change at the correct time intervals.
    ```

### Step 4.4: Refactor `useGameStateManager` State (Set -> Map)

*   **Status:** Completed
*   **Scope:** `src/GameFlow/state/useGameStateManager.ts`.
*   **Reason:** Modify the state structure to allow storage of completion stages alongside completed word IDs. Prerequisite for recording stage data.
*   **Implementation:**
    1.  Change `completedWords` state definition from `useState<Set<string>>` to `useState<Map<string, { stage: number }>>(new Map())`.
    2.  Update all internal reads: change checks like `completedWords.has(wordId)` to continue working with the Map keys (e.g., in `isEditableCell` and the completion `useEffect`).
    3.  Update the internal write within the completion `useEffect`: temporarily set stage to 0 (e.g., `.set(wordId, { stage: 0 })`) to ensure the structure works before full integration.
    4.  Ensure dependent logic like `isEditableCell` correctly checks `completedWords.has(wordId)`.
*   **Test:** **Rigorous Manual Testing Checklist**. Focus heavily on:
    *   Can words still be completed? (Check visually and via DevTools seeing `{ stage: 0 }` entries in the Map).
    *   Does Strict Locking (`INP-05`, `DEL-04`) still work based on the Map keys?
    *   Do completion-dependent UI elements (if any exist beyond basic color) still work?
*   **Check:**
    *   [x] `completedWords` state type changed to `Map`.
    *   [x] Internal reads updated (`.has`).
    *   [x] Internal writes updated (`.set` with placeholder stage).
    *   [x] `isEditableCell` logic confirmed correct for Map.
    *   [x] Test Checked (Rigorous Manual Checklist, DevTools state inspection).
*   **Notes:**
    ```text
    Successfully refactored completedWords from a Set<string> to a Map<string, CompletionData> structure, enabling us to store stage information alongside word IDs. Updated all related functions to use Map methods (has, get, set) instead of Set operations. Added a CompletionData interface with a stage property and implemented word completion tracking that preserves existing stage data. Modified ThemedCrossword component to handle the Map structure and visually display completion status. A debug panel was temporarily added to visualize the Map structure, showing entries in the format "wordId: stage=0". Manual testing confirmed that word completion detection, strict locking, and completion status persistence all work correctly with the new data structure.
    ```

### Step 4.5: Integrate Timer Stage into `useGameStateManager`

*   **Status:** Completed
*   **Scope:** `App.tsx`, `src/GameFlow/state/useGameStateManager.ts`.
*   **Reason:** Connect the timer's calculated stage to the game state logic so the correct stage is recorded upon word completion. Determine overall game completion.
*   **Implementation:**
    1.  In `useGameStateManager.ts`: Add a `useRef` e.g., `const stageForNextCompletionCheckRef = useRef<number>(0);`.
    2.  In `useGameStateManager.ts`: Modify `handleGuessInput` signature to accept `currentStage`: `handleGuessInput(row, col, char, currentStage: number)`. Inside, *before* calling `setGridData`, update the ref: `stageForNextCompletionCheckRef.current = currentStage;`.
    3.  In `useGameStateManager.ts`: Modify the completion `useEffect`. When a word `wordId` is completed, read the stage from the ref: `const stageToRecord = stageForNextCompletionCheckRef.current;`. Use this value in the state update: `setCompletedWords(prev => new Map(prev).set(wordId, { stage: stageToRecord }));`.
    4.  In `useGameStateManager.ts`: Calculate `isGameComplete` state (e.g., `completedWords.size === totalNumberOfWordsInPuzzle`). Return `isGameComplete`.
    5.  In `App.tsx`: Call `useTimer({ isGameActive: isGameStarted && !isGameComplete });` -> get `currentStage`. Call `useGameStateManager()` -> get `gameState`.
    6.  In `App.tsx`: Define wrapper action handler(s): `const handleGuessInputWrapper = (row: number, col: number, char: string) => gameState.handleGuessInput(row, col, char, currentStage);`.
    7.  In `App.tsx`: Pass down a modified `gameState` object with the wrapper action: `const effectiveGameState = { ...gameState, handleGuessInput: handleGuessInputWrapper };` -> pass `effectiveGameState` to `<ThemedCrossword>`.
    8.  In `App.tsx`: Use the returned `isGameComplete` to correctly calculate `isGameActive` for the `useTimer` prop.
*   **Test:** **Rigorous Manual Testing Checklist**. Focus heavily on:
    *   Completing words at different times (before 30s, 31-70s, etc.).
    *   Inspecting `completedWords` state in DevTools to verify the **correct stage number** (1, 2, 3, 4, 5) is stored based on completion time.
    *   Verify timer stops exactly when `isGameComplete` becomes true.
    *   Verify no regressions in other functionality.
*   **Check:**
    *   [x] `useRef` added to `useGameStateManager` for stage passing.
    *   [x] `handleGuessInput` modified (signature & updates ref).
    *   [x] Completion `useEffect` uses stage from ref.
    *   [x] `isGameComplete` calculated and returned.
    *   [x] `App.tsx` calls hooks, defines wrapper action, passes effective state.
    *   [x] Timer stops correctly on game completion.
    *   [x] Test Checked (Rigorous Manual Checklist, DevTools stage inspection).
*   **Notes:**
    ```text
    Successfully integrated the timer stage tracking with word completion. Modified useGameStateManager to store the current stage in a ref and use that value when marking words as complete. Implemented isGameComplete calculation based on the count of completed words versus total words. In App.tsx, created a wrapper for handleGuessInput that passes the current timer stage to the game state manager. Made the timer stop when the game is complete by connecting isGameComplete to the isGameActive parameter of useTimer. Testing confirmed that words completed at different time intervals are correctly assigned different stage values, and the timer stops exactly when all words are completed.
    ```

### Step 4.6: Implement and Integrate `TimerDisplay` Component

*   **Status:** Completed
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
    *   [x] `TimerDisplay.tsx` component created.
    *   [x] Time formatting logic (MM:SS) implemented correctly.
    *   [x] Component styled using `styled-components`.
    *   [x] Component integrated into layout, receives `elapsedTime`.
    *   [x] Conditional rendering based on `isGameStarted` implemented.
    *   [x] Test Checked (Manual E2E).
*   **Notes:**
    ```text
    Implemented TimerDisplay component that formats time in MM:SS format with padding for minutes and seconds. Used styled-components for styling with dynamic background colors based on the current stage (0-5). Integrated component into App.tsx with appropriate props (elapsedTime, currentStage, isVisible). Fixed a theme access issue by moving the ThemeProvider from ThemedCrossword.tsx to App.tsx to ensure all components have access to the theme. Updated stage 0 handling to use the same color as stage 1 (blue), and standardized text color to white for all stages for consistency.
    ```

### Step 4.6.5: Style Final Completion Time Display

*   **Status:** Completed
*   **Scope:** `src/Timer/hooks/useTimer.ts`, `src/App.tsx`, validation.
*   **Reason:** Define and confirm the visual appearance of the timer display *after* the puzzle is completed and the timer value freezes.
*   **Implementation:**
    1.  **Enhanced useTimer Hook:** Modified the useTimer hook to accept an additional `isGameComplete` parameter and added logic to preserve the final elapsed time when the game is completed:
        - Added `wasCompletedRef` to track completion state
        - Added conditional logic to prevent resetting the timer if the game is completed
        - Added dependency on `isGameComplete` to the useEffect
    2.  **Updated App.tsx:** Modified App.tsx to pass the game completion state to the useTimer hook:
        ```typescript
        const { elapsedTime, currentStage } = useTimer({ 
          isGameActive: isGameStarted && !gameState.isGameComplete,
          isGameComplete: isGameStarted && gameState.isGameComplete
        });
        ```
    3.  **Timer Behavior:** Now the timer stops when `isGameComplete` becomes `true`, but preserves the final `elapsedTime` state instead of resetting it to zero.
    4.  **`TimerDisplay` Styling:** The `TimerDisplay` component receives the final `elapsedTime` and final `currentStage`, and remains visible after game completion with the appropriate stage color.
*   **Test:** Manual E2E: Complete the puzzle. Verify that the `TimerDisplay` remains visible, shows the correct final MM:SS time, and maintains the correct background/text color associated with the final completion stage (e.g., Stage 5 Red if applicable).
*   **Check:**
    *   [x] Final time is displayed correctly (not reset).
    *   [x] Final stage background color is displayed correctly.
    *   [x] Final stage text color is displayed correctly.
    *   [x] Test Checked (Manual E2E).
*   **Notes:**
    ```text
    Modified the useTimer hook to preserve the final elapsed time when the game is completed. Added wasCompletedRef to track completion state and prevent timer reset when the game is completed but not active. The timer now stops when the game is complete but keeps displaying the final time with the appropriate stage color. Manual testing confirmed that the timer display remains visible after puzzle completion, showing the correct final time and maintaining the appropriate stage color.
    ```

### Step 4.7: Propagate Stage Data for Cell Styling

*   **Status:** Not Started
*   **Scope:** `ThemedCrossword.tsx`, `CrosswordProvider.tsx`, `context.ts`.
*   **Reason:** Make the specific completion stage (`1-5`) for each cell available to the `Cell` component for styling. Adapt existing propagation logic for the new Map structure.
*   **Implementation:**
    1.  In `ThemedCrossword.tsx`: Modify the existing `useMemo` hook that calculates `cellCompletionStatus`.
        *   It should read the `completedWords: Map<string, { stage: number }>` from `gameState`.
        *   Iterate through `completedWords`. For each `[wordId, { stage }]` entry:
            *   Look up the clue geometry (`puzzleData[direction]?.[number]`).
            *   Find all cells belonging to that word.
            *   Add entries `[cellKey, { stage: stage }]` to the `cellCompletionStatus` map.
        *   Ensure the output map type is `Map<cellKey, { stage: number } | null>`.
    2.  Update the `CrosswordContextType` (`context.ts`) to expect `cellCompletionStatus?: Map<string, { stage: number } | null>`.
    3.  Update `CrosswordProviderProps` and `PropTypes` in `CrosswordProvider.tsx` to accept the new map type `Map<string, { stage: number } | null>`.
    4.  Update the context value provided by `CrosswordProvider` to include the modified `cellCompletionStatus` map. Update `useMemo` dependencies for context value.
*   **Test:** Code review. Static Analysis (TS). DevTools E2E Inspection: After completing words at different stages, inspect the `cellCompletionStatus` prop/context value. Verify it's a Map where keys are `cellKeys` and values are `{ stage: number }` objects corresponding to the correct stage, or `null` for incomplete cells.
*   **Check:**
    *   [ ] `useMemo` hook in `ThemedCrossword` modified for Map input/output.
    *   [ ] Context Type Updated (`context.ts`) for new Map structure.
    *   [ ] Provider Props/PropTypes Updated (`CrosswordProvider.tsx`).
    *   [ ] Context Value Updated (`CrosswordProvider.tsx`).
    *   [ ] Test Checked (Review, Static Analysis, E2E DevTools Inspection).
*   **Notes:**
    ```text
    Modified existing data propagation logic (`ThemedCrossword` useMemo, `CrosswordProvider`, context) to pass down a map indicating the specific completion stage for each relevant cell key, derived from the new Map state.
    ```

### Step 4.8: Apply Stage Colors in Cell Component

*   **Status:** Completed
*   **Scope:** `src/Crossword/components/Cell.tsx`.
*   **Reason:** Implement the final visual requirement: coloring cell backgrounds based on their completion stage using the defined theme colors.
*   **Implementation:**
    1.  Update the component props (`CellProps`) and `propTypes` to accept `completionStatus?: { stage: number } | null`.
    2.  Modify the code consuming context/props to get the stage: `const stage = props.completionStatus?.stage;`.
    3.  In the `styled-components` definition (`rect` fill logic):
        *   Refactor the fill logic (perhaps using a helper function `getBackgroundColor(theme, stage, isFocused, isHighlighted)`).
        *   Implement a `switch(stage)` or similar within this logic:
            *   `case 1: return theme.colors.completionStage1Background;`
            *   `case 2: return theme.colors.completionStage2Background;`
            *   ... etc. for 3, 4, 5.
            *   `default:` handle focus/highlight/default color based on other props (use existing `focusBackground`, `highlightBackground`, `cellBackground`).
        *   Ensure completion stage colors have higher precedence than focus/highlight/default.
    4.  Add a helper function `getTextColor()` to ensure text is readable against colored backgrounds.
*   **Test:** **Rigorous Manual E2E**. Complete words ensuring they fall into different time brackets (Stage 1, 2, 3, 4, 5).
    *   Verify the correct background color (Blue, Green, Yellow, Orange, Red) appears immediately upon completion for the cells of that word.
    *   Verify colors persist correctly.
    *   Verify focus/highlight styles still work correctly on *incomplete* cells and don't override completion colors.
*   **Check:**
    *   [x] `CellProps` / `propTypes` updated.
    *   [x] Stage data consumed correctly.
    *   [x] Styling logic implemented in `styled-components` to select color based on stage.
    *   [x] Correct placeholder colors applied for stages 1-5.
    *   [x] Style precedence logic is correct (completion > focus/highlight > default).
    *   [x] Test Checked (Rigorous Manual E2E).
*   **Notes:**
    ```text
    Updated Cell.tsx to consume completion stage data and apply the corresponding background color from the theme. Implemented a getBackgroundColor helper function that uses a switch statement to select the appropriate color based on the completion stage. Added a getTextColor helper function to ensure text is readable against colored backgrounds by using white text for all completed cells. Verified correct colors appear based on timed completion via manual E2E testing. The implementation maintains the correct precedence order (Completion > Focus > Highlight > Default) and handles edge cases appropriately.
    ```

---

## Future Considerations & Architectural Fitness

Based on discussions during planning, the architecture established in this phase is confirmed to be suitable for potential future enhancements without major refactoring:

*   **Stage Countdown Bar:** The `useTimer` hook can be extended to return stage start/end times. A new UI component can consume this data along with `elapsedTime` and `currentStage` to calculate and render a progress bar representing time elapsed within the current stage.
*   **Dynamic Coloring:** Both the existing `TimerDisplay` and the potential `StageCountdownBar` can easily have their colors (text, background) dynamically set based on the `currentStage` prop, using standard `styled-components` theming practices.
*   **Animations:** The mechanism of stage data propagating to the `Cell` component provides a standard hook for triggering CSS Transitions, CSS Animations, or JavaScript animation libraries upon cell completion, allowing for smooth color change effects later.
*   **Score Calculation:** The stage information stored in the `completedWords` Map can be used to calculate a score based on completion speed. A scoring system could be implemented that assigns more points to words completed in earlier stages.
*   **Statistics & Analytics:** The completion stage data can be aggregated to provide statistics about the player's performance, such as average completion time per word, distribution of completion stages, and improvement over time.
*   **Accessibility Enhancements:** The visual stage colors can be complemented with additional accessibility features, such as screen reader announcements for completion stages or high-contrast mode options.
*   **Theme Customization:** The placeholder colors can be made configurable, allowing players to customize the visual appearance of the game while maintaining the stage-based feedback system.

## Concluding Remarks

Phase 4 has successfully implemented the core timer and multi-stage completion mechanics, which are central to the game's unique identity. The implementation includes:

1. A user-initiated timer that starts when the player clicks the "Start Game" button
2. Multi-stage completion logic based on time thresholds (0-30s, 31-70s, 71-120s, 121-180s, >180s)
3. Distinct visual color feedback for each stage using the defined colors (Blue, Green, Yellow, Orange, Red)
4. A timer display showing elapsed time in MM:SS format
5. Proper state management to record completion stages and determine overall game completion

The architecture established in this phase provides a solid foundation for future enhancements. The use of a Map structure for storing completion data, combined with the stage-based visual feedback system, creates a flexible and extensible framework. The timer integration with game state ensures accurate recording of completion times, while the visual feedback system provides immediate and intuitive feedback to players.

While the implementation focuses on the core functionality, the architecture is designed to accommodate additional features such as scoring, statistics, animations, and accessibility enhancements. The use of React hooks, context, and styled-components ensures a maintainable and scalable codebase.

The successful completion of Phase 4 marks a significant milestone in the development of the game, bringing the core gameplay mechanics to life. The next phases can build upon this foundation to enhance the user experience, add more features, and refine the visual design.