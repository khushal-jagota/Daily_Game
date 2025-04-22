# Crossword colour shift

## Context
**Goal:** Replace the jarring color snap on cell state changes with a smooth fade, add a pulse effect on word completion, and introduce a cascading delay for the color change across completed words.

**Core Strategy:** Leverage CSS transitions for the color fade by applying colors via inline styles. Use temporary state and CSS classes to trigger a pulse animation, and inline `transition-delay` for the cascade. Prioritize minimal risk and iterative implementation.

---

## Phase 1: Implement Smooth Color Fade (Low Risk)

**Objective:** Make the background color of cells fade smoothly when their state (focus, highlight, completion) changes.

**1. Modify `CrosswordGrid.tsx` - Apply Inline Style:**
   - Change the `<rect>` element within the cell rendering loop to apply the `fill` color using the `style` prop instead of the `fill` attribute.

   ```typescript
   // src/Crossword/components/CrosswordCore/CrosswordGrid.tsx

   // Inside the return statement, within the gridData.map...
   return (
     <g /* ... */ >
       <rect
           x={0} y={0} width={1} height={1}
           // REMOVE: fill={cellFill}
           // ADD: Apply color via inline style
           style={{
               fill: cellFill, // Apply calculated color here
               // Placeholder for cascade delay later:
               // transitionDelay: `${cascadeDelayMs}ms`
           }}
           stroke={finalTheme?.cellBorder ?? "#dde1e4"}
           strokeWidth={0.02}
           className={isFocused ? "focused" : isHighlighted ? "highlighted" : ""}
           // No transition property needed here - handled globally
       />
       {/* ... text elements ... */}
     </g>
   );
   ```

**2. Modify `CrosswordGrid.tsx` - Add Data Attribute:**
   - Add a `data-crossword-grid="true"` attribute to the root `<StyledSvg>` component for stable CSS targeting.

   ```typescript
   // src/Crossword/components/CrosswordCore/CrosswordGrid.tsx

   // Inside the return statement
   return (
     <SvgWrapper>
         {/* Add data-crossword-grid attribute here */}
         <StyledSvg
             viewBox={viewBox}
             preserveAspectRatio="xMidYMid meet"
             data-crossword-grid="true" // Add this attribute
         >
             {/* ... rest of SVG content ... */}
         </StyledSvg>
         {/* ... hidden input ... */}
     </SvgWrapper>
   );
   ```

**3. Modify `CrosswordStyles.ts` - Add Transition Rule & Reduced Motion:**
   - Update `GlobalStyle` to target the `<rect>` elements using the data attribute.
   - Add the `transition` property for the `fill`.
   - Include a `@media (prefers-reduced-motion: reduce)` query to disable the transition.

   ```typescript
   // src/Crossword/styles/CrosswordStyles.ts
   import styled, { createGlobalStyle, keyframes } from 'styled-components';
   // ... other imports and theme/animation definitions ...

   export const GlobalStyle = createGlobalStyle`
     /* ... other global styles ... */

     /* Target rects using the data attribute */
     svg[data-crossword-grid] g > rect {
       transition: fill 280ms ease-in-out; /* Adjust timing as needed */
     }

     /* Accessibility: Disable transition if user prefers reduced motion */
     @media (prefers-reduced-motion: reduce) {
       svg[data-crossword-grid] g > rect {
         transition: none;
       }
       /* Also disable pulse animation later */
       /* g.animate-pulse-now { animation: none; } */
     }

     /* ... rest of GlobalStyle ... */
   `;
   ```

**4. Validation:**
   - Test thoroughly in Chrome, Firefox, and Safari.
   - Verify smooth color fades when:
     - Cell gains/loses focus.
     - Cell gains/loses highlight.
     - A word is completed, changing the `cellCompletionStatus` and thus the `cellFill` value.
   - Confirm the transition respects the `prefers-reduced-motion` setting.

---

## Phase 2: Add Pulse & Cascade Effects (Low-Moderate Risk)

**Objective:** Add a visual pulse animation when a word is newly completed, and make the color fade cascade across the letters of that word. Implement *after* Phase 1 is validated.

**1. Modify `useGameStateManager.ts` - Track Recent Completions:**
   - Add state to track *newly* completed word IDs (`Set<string>`).
   - Add a `useRef` for the clearing timeout.
   - Update the `useEffect` that checks word completion:
     - Compare previous `completedWords` with the new map to identify `justCompleted` words.
     - If `justCompleted` is not empty, update the `recentlyCompletedWordIds` state.
     - Set a timeout (e.g., 1000ms) to clear `recentlyCompletedWordIds`.
     - **Add a `useEffect` cleanup function** to clear the timeout on component unmount.
   - Return `recentlyCompletedWordIds` from the hook.

   ```typescript
   // src/GameFlow/state/useGameStateManager.ts
   import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
   // ... other imports ...

   export function useGameStateManager() {
     // ... existing state ...
     const [recentlyCompletedWordIds, setRecentlyCompletedWordIds] = useState<Set<string>>(new Set());
     const recentlyCompletedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

     useEffect(() => {
         // ... (calculate newlyCompletedWords) ...

         const justCompleted = new Set<string>();
         let mapChanged = newlyCompletedWords.size !== completedWords.size;

         for (const [wordId, data] of newlyCompletedWords.entries()) {
             const existingData = completedWords.get(wordId);
             if (!existingData) {
                 justCompleted.add(wordId);
                 mapChanged = true;
             } else if (existingData.stage !== data.stage) {
                 mapChanged = true;
             }
         }
        if (!mapChanged) {
            for (const wordId of completedWords.keys()) {
                 if (!newlyCompletedWords.has(wordId)) {
                    mapChanged = true; break;
                 }
             }
        }

         if (mapChanged) {
             setCompletedWords(newlyCompletedWords); // Update main completion map

             if (justCompleted.size > 0) {
                 setRecentlyCompletedWordIds(justCompleted); // Set recently completed

                 // Clear previous timeout if any
                 if (recentlyCompletedTimeoutRef.current) {
                     clearTimeout(recentlyCompletedTimeoutRef.current);
                 }
                 // Set new timeout to clear the 'recent' status
                 recentlyCompletedTimeoutRef.current = setTimeout(() => {
                     setRecentlyCompletedWordIds(new Set());
                 }, 1000); // Adjust duration (e.g., pulse animation duration + buffer)
             }
         }

         // Add cleanup function for the timeout
         return () => {
             if (recentlyCompletedTimeoutRef.current) {
                 clearTimeout(recentlyCompletedTimeoutRef.current);
             }
         };
     // Ensure dependencies include completedWords for proper comparison
     }, [gridData, puzzleData, checkWordCorrectness, completedWords, setCompletedWords]);

     return {
         // ... other returned values
         recentlyCompletedWordIds, // Expose the set
     };
   }
   ```

**2. Modify `ThemedCrossword.tsx` - Pass State Down:**
   - Get `recentlyCompletedWordIds` from `useGameStateManager`.
   - Pass it as a prop to `CrosswordProvider`.

   ```typescript
   // src/Crossword/components/ThemedCrossword.tsx
   const ThemedCrossword: React.FC<ThemedCrosswordProps> = ({ gameState, onInputRefChange }) => {
     // Assuming useGameStateManager is called within gameState or directly here
     // const recentlyCompletedWordIds = useGameStateManager().recentlyCompletedWordIds; // Or get from gameState if refactored

     return (
       // ...
       <CrosswordProvider
         // ... other props
         recentlyCompletedWordIds={gameState.recentlyCompletedWordIds} // Pass it down
       >
         <CrosswordGrid onInputRefChange={onInputRefChange} />
       </CrosswordProvider>
       // ...
     );
   };
   ```

**3. Modify `CrosswordProvider.tsx` & `context.ts` - Propagate State:**
   - Add `recentlyCompletedWordIds` prop definition (PropTypes and TypeScript interface).
   - Add `recentlyCompletedWordIds` to `CrosswordContextType` in `context.ts`.
   - Accept the prop and pass it into the `CrosswordContext.Provider` value. Remember to add it to the `useMemo` dependency array for the context value.

**4. Modify `CrosswordGrid.tsx` - Apply Pulse Class & Cascade Delay:**
   - Consume `recentlyCompletedWordIds` and `clues` from `CrosswordContext`.
   - Inside the cell rendering loop:
     - Check if the current cell's `across` or `down` word ID is in `recentlyCompletedWordIds`.
     - If yes, add the class `animate-pulse-now` to the surrounding `<g>` element.
     - Calculate the cell's 0-based index within the word(s) it belongs to (using `clues` data for start position).
     - Calculate the `cascadeDelayMs` (e.g., `index * 80`). Use `Math.max` if the cell is in two recently completed words.
     - Apply the delay via the inline `style` prop on the `<rect>`: `style={{ fill: cellFill, transitionDelay: \`${cascadeDelayMs}ms\` }}`.

   ```typescript
   // src/Crossword/components/CrosswordCore/CrosswordGrid.tsx
    import React, { useContext, useRef, useMemo } from "react"; // Added useMemo if not present
    // ... other imports

    export default function CrosswordGrid({ onInputRefChange }: ICrosswordGridProps) {
        const {
            // ... other context values
            clues, // Need clues data
            recentlyCompletedWordIds, // Get the trigger set
        } = useContext(CrosswordContext);

        // Optional: Pre-calculate clue info map for lookup
        const clueInfoMap = useMemo(() => {/* ... as shown previously ... */}, [clues]);

        return (
            <SvgWrapper>
                <StyledSvg /* ... data-crossword-grid="true" ... */ >
                    {/* ... background rect ... */}
                    {gridData.flatMap((rowData, row) =>
                        rowData.map((cellData, col) => {
                            if (!cellData.used) return null;
                            // ... isFocused, isHighlighted, completionStatus, cellFill ...
                            const key = getCellKey(row, col);

                            let shouldPulse = false;
                            let cascadeDelayMs = 0;
                            const baseDelayFactor = 80; // ms per letter

                            // Check Across
                            if (cellData.across) {
                                const wordId = `${cellData.across}-across`;
                                if (recentlyCompletedWordIds?.has(wordId)) {
                                    shouldPulse = true;
                                    const info = clueInfoMap.get(wordId);
                                    if (info) cascadeDelayMs = Math.max(cascadeDelayMs, (col - info.col) * baseDelayFactor);
                                }
                            }
                            // Check Down
                            if (cellData.down) {
                                const wordId = `${cellData.down}-down`;
                                if (recentlyCompletedWordIds?.has(wordId)) {
                                    shouldPulse = true;
                                    const info = clueInfoMap.get(wordId);
                                    if (info) cascadeDelayMs = Math.max(cascadeDelayMs, (row - info.row) * baseDelayFactor);
                                }
                            }

                            const groupClassName = shouldPulse ? 'animate-pulse-now' : '';

                            return (
                                <g key={key} /* ... */ className={groupClassName}>
                                    <rect
                                        /* ... */
                                        style={{
                                            fill: cellFill,
                                            transitionDelay: `${cascadeDelayMs}ms` // Apply delay
                                        }}
                                        /* ... */
                                    />
                                    {/* ... text elements ... */}
                                </g>
                            );
                        })
                    )}
                </StyledSvg>
                {/* ... hidden input ... */}
            </SvgWrapper>
        );
    }
   ```

**5. Modify `CrosswordStyles.ts` - Target Pulse Animation:**
   - Ensure the `wordGoldPulse` keyframes are defined.
   - Target the `.animate-pulse-now` class (applied to the `<g>`) to run the animation.
   - Include the `prefers-reduced-motion` check to disable the pulse animation.

   ```typescript
   // src/Crossword/styles/CrosswordStyles.ts

   // Define wordGoldPulse keyframes if not already present

   export const GlobalStyle = createGlobalStyle`
     /* ... other styles ... */
     svg[data-crossword-grid] g > rect { /* Base transition */ }

     /* Target the temporary class for the pulse animation */
     g.animate-pulse-now {
       animation: ${wordGoldPulse} 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Adjust timing */
       transform-origin: center;
     }

     @media (prefers-reduced-motion: reduce) {
       svg[data-crossword-grid] g > rect { transition: none; }
       /* Disable pulse */
       g.animate-pulse-now {
         animation: none;
       }
     }
   `;
   ```

**6. Validation:**
   - Test the complete flow thoroughly across browsers.
   - Confirm smooth color fades still work.
   - Verify that only newly completed words trigger the pulse animation *once*.
   - Check that the color fade cascades correctly across the letters (left-to-right for across, top-to-bottom for down).
   - Test intersections where both words complete simultaneously (should take the longer delay).
   - Verify reduced motion settings disable both the fade and the pulse.

---

**User Input During Animation:**

Standard React re-renders caused by user input (`setGridData`, selection changes) are necessary and **should not interrupt** these browser-managed CSS transitions and animations. The browser will smoothly animate towards the *latest* target state provided by React. No specific code changes are needed to handle this interaction unless visual jank is observed during testing.
```