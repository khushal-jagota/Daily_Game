# Phase Implementation Planning: Knowledge Acquisition

This document outlines questions needed to inform the detailed implementation plans for Phase 4.5 and Phase 5. Understanding the current state of the relevant code sections post-Phase 4 is crucial for accurate planning.

---

## Phase 4.5: Stage Progress Bar

### Questions about `useTimer` Hook (`src/Timer/hooks/useTimer.ts`)

1.  **Question:** What are the exact values currently returned by the `useTimer` hook? (e.g., `{ elapsedTime: number, currentStage: number }`)
    *   **Rationale:** Need to confirm the starting point before adding the new `stageTimeRemainingRatio` calculation and return value.
    *   **Answer:**
        ```
        The useTimer hook returns an object with the following properties:
        {
          elapsedTime: number,      // Current elapsed time in seconds
          currentStage: number      // Current completion stage (0-5) based on elapsed time
        }
        This is defined in the UseTimerReturn interface within the useTimer.ts file.
        ```

2.  **Question:** Inside `useTimer`, how is `currentStage` calculated? Is there already a helper function like `calculateStage(elapsedTime)` and does it use a clear structure (like an array of thresholds or if/else chain) that can be easily adapted to find the start/end times for the current stage?
    *   **Rationale:** Understanding the existing stage calculation logic helps determine the cleanest way to integrate the calculation for `stageTimeRemainingRatio`. Reusing existing threshold definitions is ideal.
    *   **Answer:**
        ```
        The useTimer hook uses a helper function called calculateStage(time: number) that implements a clear if/else chain structure to determine the stage. The function is defined within the hook and uses these thresholds:
        
        - Stage 0: time <= 0 (not started)
        - Stage 1: time <= 30 (0-30s, Blue)
        - Stage 2: time <= 70 (31-70s, Green)
        - Stage 3: time <= 120 (71-120s, Yellow)
        - Stage 4: time <= 180 (121-180s, Orange)
        - Stage 5: time > 180 (>180s, Red)
        
        This structure can be easily adapted to calculate stage time remaining ratios by extracting the start/end times for each stage.
        ```

3.  **Question:** Does the `useTimer` hook currently handle the "freeze on completion" logic internally, or does `App.tsx` stop passing `isGameActive=true`? Specifically, how does `elapsedTime` stop incrementing and how is the final `currentStage` preserved?
    *   **Rationale:** Need to ensure the new `stageTimeRemainingRatio` also freezes correctly upon game completion, consistent with the timer value.
    *   **Answer:**
        ```
        The useTimer hook handles freezing on completion internally. In App.tsx, the hook is called with parameters:
        
        const { elapsedTime, currentStage } = useTimer({ 
          isGameActive: isGameStarted && !gameState.isGameComplete,
          isGameComplete: isGameStarted && gameState.isGameComplete
        });
        
        Within useTimer, it tracks completion with a wasCompletedRef to preserve the final time. When isGameComplete is true:
        1. It sets wasCompletedRef.current = true
        2. Clears any running interval to stop incrementing
        3. The effect does not reset startTimeRef or elapsedTime when wasCompletedRef is true
        
        This ensures the timer stops and the final values are preserved.
        ```

### Questions about `TimerDisplay` Component (`src/Timer/components/TimerDisplay.tsx`)

4.  **Question:** How is the `TimerDisplay` component currently styled? Is it a single `styled-component`? Does it receive `currentStage` as a prop to dynamically set its background/text color via the theme?
    *   **Rationale:** Planning the layout for the progress bar requires knowing how the existing timer element is structured and styled. We need to know how stage colors are currently applied.
    *   **Answer:**
        ```
        The TimerDisplay component is a functional component that uses a single styled component called TimerContainer. It receives three props:
        
        - elapsedTime: number
        - currentStage: number
        - isVisible: boolean
        
        The TimerContainer styled component receives $visible and $stage props (with $ prefix to avoid passing to DOM) and dynamically sets its background color based on the current stage using a switch statement that accesses the appropriate theme color:
        
        switch(props.$stage) {
          case 0:
          case 1: return props.theme.completionStage1Background; // Blue
          case 2: return props.theme.completionStage2Background; // Green
          case 3: return props.theme.completionStage3Background; // Yellow
          case 4: return props.theme.completionStage4Background; // Orange
          case 5: return props.theme.completionStage5Background; // Red
          default: return props.theme.cellBackground || '#ccc';
        }
        
        The component also has styling for visibility, padding, font size, border-radius, and other properties.
        ```

### Questions about `App.tsx` / UI Structure

5.  **Question:** In `App.tsx`, how are the `TimerDisplay` and other UI elements (like `ThemedCrossword`, `ClueVisualiser`) laid out? Is it using simple Flexbox/Grid via styled-components defined in `src/Layout/components.ts`, or is there a more complex structure?
    *   **Rationale:** Need to determine where to insert the new `StageProgressBar` component structurally and how to achieve the desired `[Timer] [Bar]` side-by-side layout using existing layout methods.
    *   **Answer:**
        ```
        In App.tsx, the UI elements are laid out using styled components defined in Layout/components.ts. The layout structure is:
        
        <AppWrapper> (flex-direction: column)
          <Banner>Daily Crossword</Banner>
          <TimerDisplay ... />
          <CrosswordArea>
            <ThemedCrossword ... />
          </CrosswordArea>
          <ClueArea>
            <ClueVisualiser ... />
          </ClueArea>
          <KeyboardArea>
            {/* Virtual keyboard placeholder */}
          </KeyboardArea>
        </AppWrapper>
        
        The AppWrapper uses a flex column layout. The TimerDisplay is a direct child of AppWrapper, at the same level as Banner, CrosswordArea, etc. It's styled to be centered (align-self: center) in the component definition. To create a side-by-side layout for [Timer][Bar], we would need to add a container that uses flex-row layout around both components.
        ```

6.  **Question:** Does `App.tsx` currently pass the `currentStage` prop to `TimerDisplay`?
    *   **Rationale:** Confirms how the new `StageProgressBar` will receive the `currentStage` for its own dynamic styling.
    *   **Answer:**
        ```
        Yes, App.tsx passes the currentStage prop to TimerDisplay:
        
        <TimerDisplay 
          elapsedTime={elapsedTime} 
          currentStage={currentStage} 
          isVisible={isGameStarted}
        />
        
        The currentStage value comes from the useTimer hook. The same prop can be passed to the new StageProgressBar component to ensure consistent styling between the timer and progress bar.
        ```

### Questions about Theme (`src/Crossword/styles/CrosswordStyles.ts`, `src/styled.d.ts`)

7.  **Question:** Are the stage background colors (`completionStage1Background` to `completionStage5Background`) defined directly within the `colors` object in the theme? Are there any other potentially relevant theme values (e.g., for borders, neutral backgrounds)?
    *   **Rationale:** Confirms the exact theme keys the `StageProgressBar` will use for dynamic coloring and potential inactive state styling.
    *   **Answer:**
        ```
        The stage background colors are defined directly in the crosswordTheme object in CrosswordStyles.ts:
        
        completionStage1Background: '#2196F3', // Blue (0-30s)
        completionStage2Background: '#4CAF50', // Green (31-70s)
        completionStage3Background: '#FFC107', // Yellow (71-120s)
        completionStage4Background: '#FF9800', // Orange (121-180s)
        completionStage5Background: '#F44336', // Red (>180s)
        
        Other relevant theme values include:
        - progressBarBackground: '#e9ecef' // Light gray background for progress bar
        - progressBarFill: '#28a745'       // Green fill for progress bar
        - cellBackground: '#fffaf0'         // Default background that could be used for inactive state
        - cellBorder: '#dde1e4'             // Border color that could be used for progress bar
        
        These are all defined in the theme and declared in the styled.d.ts TypeScript definition file.
        ```

---

## Phase 5: Share Feature (Canvas PNG)

### Questions about State & Data Access

8.  **Question:** Upon game completion, what component is responsible for detecting this (`isGameComplete === true`) and triggering potential post-game actions (like displaying the Share button)? Is this logic in `App.tsx`?
    *   **Rationale:** Need to identify where the Share button UI and the trigger for the canvas generation logic should be placed.
    *   **Answer:**
        ```
        The game completion state (isGameComplete) is calculated in the useGameStateManager hook as a useMemo value based on whether all words are completed. App.tsx has access to this value through the gameState object:
        
        const gameState = useGameStateManager();
        
        App.tsx currently displays a debug panel that shows "GAME COMPLETE!" when gameState.isGameComplete is true:
        
        <DebugPanel>
          <div>
            {gameState.isGameComplete && <span>GAME COMPLETE!</span>}
          </div>
          <div style={{ marginTop: '8px' }}>Completed Words:</div>
          <pre>{completedWordsDebug || '(none)'}</pre>
        </DebugPanel>
        
        This indicates that App.tsx is the appropriate place to add the Share button UI and trigger the canvas generation logic, as it already has access to the completion state and displays completion feedback.
        ```

9.  **Question:** How is the final `cellCompletionStatus: Map<string, { stage: number } | null>` derived and where is it accessible from when the game is complete? Is it readily available in `App.tsx`'s scope via the `useGameStateManager` return value, or does it need to be passed up/retrieved differently?
    *   **Rationale:** The canvas rendering function needs this map to color the grid cells accurately. Need to confirm easy access.
    *   **Answer:**
        ```
        The completedWords Map<string, CompletionData> is maintained in the useGameStateManager hook, where CompletionData contains { stage: number }. This is accessible in App.tsx through:
        
        const gameState = useGameStateManager();
        
        The map is updated in a useEffect within useGameStateManager that runs when gridData changes. For each completed word, it records the stage when it was completed. The data structure uses word IDs as keys (format: "number-direction", e.g., "1-across") and stores the completion stage.
        
        This map can be accessed in App.tsx via gameState.completedWords and is already used to generate the completedWordsDebug display, showing it's readily available for the canvas rendering function.
        ```

10. **Question:** Where is the `puzzleData` (containing grid dimensions, theme name/number, cell layout) stored and accessed after initial load? Is it held in state within `App.tsx` or readily accessible from `useGameStateManager` or another central place?
    *   **Rationale:** The canvas renderer needs puzzle dimensions, theme info for the header, and the grid layout to know which cells are playable/blanks.
    *   **Answer:**
        ```
        The puzzleData is stored in the useGameStateManager hook:
        
        const [puzzleData, setPuzzleData] = useState<CluesInput>(prototypePuzzle);
        
        It's initialized with the prototypePuzzle data and is available in App.tsx through:
        
        const gameState = useGameStateManager();
        
        The puzzleData contains clue information including row, col, and answer data for each clue. There is also gridData (created using createGridData(prototypePuzzle)) which contains the structured grid representation.
        
        Both puzzleData and gridData are accessible in App.tsx via gameState.puzzleData and would be passed to gameState.gridData, providing all the necessary dimensions and layout information for canvas rendering.
        ```

11. **Question:** Is the final `elapsedTime` value preserved and easily accessible in `App.tsx`'s scope after game completion?
    *   **Rationale:** Needed for rendering the final time onto the canvas image.
    *   **Answer:**
        ```
        Yes, the final elapsedTime value is preserved and easily accessible in App.tsx after game completion. The useTimer hook maintains the elapsed time internally and freezes it when isGameComplete is true:
        
        const { elapsedTime, currentStage } = useTimer({ 
          isGameActive: isGameStarted && !gameState.isGameComplete,
          isGameComplete: isGameStarted && gameState.isGameComplete
        });
        
        When the game is complete, the useTimer hook preserves the final time value and App.tsx continues to have access to it through the elapsedTime constant. This value can be directly used for rendering onto the canvas image.
        ```

### Questions about Styling & Rendering

12. **Question:** What fonts are currently used for the Timer, Clues, and potentially any headers? Are they standard web fonts or custom fonts loaded via CSS (`@font-face`)? If custom, where are the font files located/loaded?
    *   **Rationale:** Essential for replicating the text style accurately on the canvas and ensuring fonts are loaded (`document.fonts.ready`) before drawing.
    *   **Answer:**
        ```
        Based on the code examined:
        
        - TimerDisplay: Uses the inherited font with font-size: 1.2rem and font-weight: bold
        - Banner: No specific font styling found beyond the container styling
        - Clue components: No specific font styling found in the code examined
        
        The styling appears to use standard web fonts rather than custom loaded fonts, as there were no @font-face declarations or font imports observed in the files examined. The TimerDisplay and other components inherit their font family from the page's default styling.
        
        To accurately replicate text on canvas, you would use the computed style of these elements to determine the exact font properties at runtime.
        ```

13. **Question:** How is the background color of the main game area/page set? Is it via a global style or a styled container in `App.tsx`?
    *   **Rationale:** Need to replicate this background on the canvas image.
    *   **Answer:**
        ```
        The layout of the app is defined in Layout/components.ts through styled components:
        
        - AppWrapper has no explicit background color set
        - CrosswordArea, ClueArea, and KeyboardArea have background colors set to #CCC, #DDD, and #EEE respectively
        
        The crosswordTheme in CrosswordStyles.ts defines gridBackground: '#fffaf0' which is used for the crossword grid itself.
        
        There doesn't appear to be a single global background color setting. To replicate the background on canvas, you would need to use the appropriate background colors for each component section based on their respective styled components' definitions.
        ```

14. **Question:** Does the `Cell.tsx` component have defined padding, border radius, or specific border styles (color, width)? How are blank/non-playable cells styled distinctly from playable, non-completed cells?
    *   **Rationale:** This visual detail needs to be replicated in the canvas grid rendering for fidelity.
    *   **Answer:**
        ```
        From the code examined, specific Cell component styling wasn't directly visible. However, the crosswordTheme in CrosswordStyles.ts defines these relevant properties:
        
        - cellBackground: '#fffaf0' - Background for answer cells
        - cellBorder: '#dde1e4' - Border for answer cells
        - gridBackground: '#fffaf0' - Overall background for the grid
        
        The TimerContainer component uses border-radius: 4px and box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), which might be consistent with other UI elements.
        
        For blank/non-playable vs. playable cells, the createGridData utility likely handles this distinction, but the specific visual styling wasn't found in the examined code. A closer look at the Cell component would be needed for complete details on border width, padding, and how non-playable cells are rendered.
        ```

### Questions about Build & Environment

15. **Question:** Are there any specific build tool configurations (Vite) or global CSS settings that might affect canvas rendering or API availability (e.g., security policies, polyfills)?
    *   **Rationale:** Mostly a sanity check for any non-standard environmental factors.
    *   **Answer:**
        ```
        No specific build tool configurations or global CSS settings that would affect canvas rendering were found in the examined code. The project appears to use standard React with styled-components for styling.
        
        There were no obvious security policies, Content-Security-Policy headers, or polyfills that would restrict canvas or image manipulation capabilities.
        
        When implementing the canvas rendering, standard considerations for browser compatibility with the Canvas API should be sufficient, with no apparent project-specific limitations or configurations that would interfere with the implementation.
        ```

---