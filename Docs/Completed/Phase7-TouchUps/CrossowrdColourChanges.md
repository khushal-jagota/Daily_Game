# Plan: Crossword Colour Shift - Dual-Speed Cascade Fade (No Pulse)

**Document Version:** 3.0 (Reverted, Refined Logic)
**Date:** [Current Date]

## 1. Overall Goal

To replace the jarring color snap on crossword cell state changes with meaningful visual feedback:
*   Implement a **fast, snappy color fade** (background and text) for focus and highlight changes.
*   Implement a **slower, cascading color fade** (background and text) for cells belonging to a newly completed word.
*   Ensure the implementation is robust, respects accessibility settings, and avoids unnecessary complexity.

## 2. Core Strategy

Leverage CSS transitions for color fades. Apply colors and transition overrides via inline `style` props on SVG elements (`rect`, `text`). Use a globally defined fast transition duration as a fallback. Conditionally override the duration (to slower) and apply a calculated delay inline for the completion cascade effect using component state derived from `useGameStateManager`. Prioritize minimal risk and robust implementation.

## 3. Prerequisites

*   Clean codebase state (changes reverted as requested).
*   Established project structure (`Layout`, `GameFlow`, `Crossword`, etc.).
*   `useGameStateManager` hook providing necessary state (`gridData`, `completedWords`, selection state, etc.).
*   `CrosswordCore` components (`CrosswordGrid.tsx`, `CrosswordProvider.tsx`, `context.ts`) and `ThemedCrossword.tsx` adapter.
*   `CrosswordGrid.tsx` rendering cells via SVG (`<g>`, `<rect>`, `<text>`).
*   `styled-components` setup (`CrosswordStyles.ts`, theme, etc.).

## 4. Implementation Steps

---

### Phase 1: Establish Base Styling & Fast Global Fade

**Objective:** Set up inline style application for colors and define a fast global CSS transition duration for default (focus/highlight) feedback.

---

#### Step 1.1: Apply Inline Styles & Data Attribute (`CrosswordGrid.tsx`)

*   **Goal:** Ensure cell background and text colors are applied via the `style` prop, enabling CSS transitions, and add a data attribute for reliable CSS targeting.
*   **Rationale:** CSS transitions require styles to be applied via CSS properties (inline or classes), not presentation attributes. The data attribute provides a stable CSS hook.
*   **Integration Steps:**
    1.  In `src/Crossword/components/CrosswordCore/CrosswordGrid.tsx`, locate the `<rect>` rendering the cell background. Ensure its `fill` color is set via the `style` prop.
        ```jsx
        <rect
            // ... other props ...
            style={{
                fill: cellFill, // Apply calculated color here
                // transition properties will be added later conditionally
            }}
            // ... other props ...
        />
        ```
    2.  Locate the `<text className="guess-text">` rendering the guess. Ensure its `fill` color is set via the `style` prop.
        ```jsx
        <text
            // ... other props ...
            className="guess-text"
            style={{
                fill: textColor, // Apply calculated color here
                 // transition properties will be added later conditionally
            }}
            // ... other props ...
        >
            {cellData.guess || ""}
        </text>
        ```
    3.  Locate the root `<StyledSvg>` component and add the `data-crossword-grid="true"` attribute.
        ```jsx
        <StyledSvg /* ... other props ... */ data-crossword-grid="true">
            {/* ... svg content ... */}
        </StyledSvg>
        ```
*   **Test:** Verify rendering and colors. Check DOM in dev tools for inline `fill` styles and the `data-crossword-grid` attribute.
*   **Checkboxes:**
    *   [ ] `<rect>` uses `style={{ fill: cellFill, ... }}`.
    *   [ ] `<text className="guess-text">` uses `style={{ fill: textColor, ... }}`.
    *   [ ] `<StyledSvg>` has `data-crossword-grid="true"`.
    *   [ ] Application renders correctly.
*   **Notes:** Essential foundation for CSS transitions.

---

#### Step 1.2: Define Constants & Fast Global Transition CSS (`GridTransitions.ts` / `CrosswordStyles.ts`)

*   **Goal:** Define transition duration constants and create the global CSS rule for the fast default transition.
*   **Rationale:** Centralizes timing values. Establishes snappy feedback for focus/highlight. Provides a non-JS fallback.
*   **Integration Steps:**
    1.  Create or modify a global style file (e.g., `src/Crossword/styles/GridTransitions.ts` or add within `CrosswordStyles.ts`).
    2.  Define and export timing constants:
        ```typescript
        // e.g., in src/Crossword/styles/constants.ts or within the style file
        export const TRANSITION_DURATIONS = {
            fast: 120, // ms for focus/highlight
            slow: 300, // ms for completion reveal
        };
        export const CASCADE_DELAY_FACTOR = 80; // ms per letter
        ```
    3.  Add the `createGlobalStyle` definition, using the data attribute selector and the fast duration constant:
        ```typescript
        import { createGlobalStyle } from 'styled-components';
        import { TRANSITION_DURATIONS } from './constants'; // Adjust import path

        export const GridTransitionStyles = createGlobalStyle`
          /* Base fast transition for focus/highlight & fallback */
          svg[data-crossword-grid="true"] g > rect,
          svg[data-crossword-grid="true"] text.guess-text {
            transition-property: fill;
            transition-duration: ${TRANSITION_DURATIONS.fast}ms;
            transition-timing-function: ease-out;
            transition-delay: 0ms; /* Explicitly default to no delay */
          }

          /* Accessibility considerations */
          @media (prefers-reduced-motion: reduce) {
            svg[data-crossword-grid="true"] g > rect,
            svg[data-crossword-grid="true"] text.guess-text {
              transition: none;
            }
          }
        `;
        ```
    4.  Ensure `<GridTransitionStyles />` is rendered in `App.tsx` within the `ThemeProvider`.
*   **Test:** Verify focus/highlight changes trigger a smooth, *fast* fade (`TRANSITION_DURATIONS.fast`). Check reduced motion disables it.
*   **Checkboxes:**
    *   [ ] Duration/delay constants defined and exported.
    *   [ ] Global style created/updated targeting `rect` and `text` via data attribute.
    *   [ ] Fast `transition-duration` applied globally using constant.
    *   [ ] Reduced motion media query included.
    *   [ ] `<GridTransitionStyles />` rendered in `App.tsx`.
    *   [ ] Fast fades validated for focus/highlight.
*   **Notes:** Centralizing constants is crucial for maintainability.

---

### Phase 2: Implement Cascade Delay & Completion Duration Override

**Objective:** Apply the calculated cascade delay and the slower transition duration *only* when cells are part of a newly completed word.

---

#### Step 2.1: Track Recent Completions & Ensure Robust Cleanup (`useGameStateManager.ts`)

*   **Goal:** Add state and logic to identify word IDs that *just* completed, ensuring the state is cleared reliably via timeout and effect cleanup.
*   **Rationale:** Provides the trigger for conditional styling. Robust cleanup prevents stale state affecting subsequent interactions.
*   **Integration Steps:**
    1.  In `src/GameFlow/state/useGameStateManager.ts`:
        *   Add state: `const [recentlyCompletedWordIds, setRecentlyCompletedWordIds] = useState<Set<string>>(new Set());`
        *   Add ref: `const recentlyCompletedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);`
        *   Modify the `useEffect` hook depending on `gridData`/`checkWordCorrectness`:
            *   Calculate `newlyCompletedWords` and identify `justCompleted` words by comparing with previous `completedWords` state.
            *   If `justCompleted.size > 0`:
                *   Call `setRecentlyCompletedWordIds(justCompleted)`.
                *   Clear any existing timeout via `clearTimeout(recentlyCompletedTimeoutRef.current)`.
                *   Set a new timeout to call `setRecentlyCompletedWordIds(new Set())` after an appropriate duration (e.g., `TRANSITION_DURATIONS.slow + 10 * CASCADE_DELAY_FACTOR` or `1000ms`). Store timeout ID in `recentlyCompletedTimeoutRef.current`.
        *   **Implement/Confirm the `useEffect`'s return cleanup function:**
            ```typescript
            return () => {
                if (recentlyCompletedTimeoutRef.current) {
                    clearTimeout(recentlyCompletedTimeoutRef.current);
                }
                // Also clear the set on cleanup
                setRecentlyCompletedWordIds(new Set());
            };
            ```
        *   Return `recentlyCompletedWordIds` from the hook.
*   **Test:** Verify `recentlyCompletedWordIds` populates correctly on completion and clears via timeout/cleanup using console logs or DevTools.
*   **Checkboxes:**
    *   [ ] `recentlyCompletedWordIds` state added.
    *   [ ] `recentlyCompletedTimeoutRef` ref added.
    *   [ ] `useEffect` correctly identifies `justCompleted` words.
    *   [ ] `useEffect` logic sets/clears timeout reliably.
    *   [ ] **Robust `useEffect` cleanup function implemented.**
    *   [ ] `recentlyCompletedWordIds` returned.
*   **Notes:** The cleanup function clearing *both* timeout and state is critical for robustness.

---

#### Step 2.2: Propagate State (`ThemedCrossword.tsx`, `CrosswordProvider.tsx`, `context.ts`)

*   **Goal:** Pass the `recentlyCompletedWordIds` set down to `CrosswordGrid`.
*   **Rationale:** Standard React data flow.
*   **Integration Steps:**
    1.  Update types/interfaces (`ThemedCrosswordProps`, `CrosswordProviderProps`, `CrosswordContextType`) to include `recentlyCompletedWordIds: Set<string>` (or optional `?`).
    2.  Pass the prop through `ThemedCrossword` -> `CrosswordProvider` -> `CrosswordContext.Provider` value.
    3.  Add `recentlyCompletedWordIds` to the `useMemo` dependency array for the context value in `CrosswordProvider`.
*   **Test:** Verify app builds and runs. Check prop/context flow in DevTools.
*   **Checkboxes:**
    *   [ ] Types/Interfaces updated in `ThemedCrossword`, `CrosswordProvider`, `context.ts`.
    *   [ ] Prop passed through component tree via props/context.
    *   [ ] `useMemo` dependencies updated in `CrosswordProvider`.
    *   [ ] Application builds and runs.
*   **Notes:** Ensure consistency between PropTypes and TS types if using both.

---

#### Step 2.3: Apply Conditional Inline Transition (`CrosswordGrid.tsx`)

*   **Goal:** Calculate and apply the cascade delay and slower duration inline via `style` props for completing cells.
*   **Rationale:** Implements the core dual-speed cascade visual effect.
*   **Integration Steps:**
    1.  In `src/Crossword/components/CrosswordCore/CrosswordGrid.tsx`:
        *   Import `TRANSITION_DURATIONS`, `CASCADE_DELAY_FACTOR`.
        *   Consume `clues`, `recentlyCompletedWordIds` from `CrosswordContext`.
        *   Create `clueInfoMap` using `useMemo`.
        *   Inside the cell rendering loop (`gridData.flatMap...`):
            *   Determine `isCompletingCell`: Check if the cell's word ID(s) are in `recentlyCompletedWordIds`.
            *   Calculate `cascadeDelayMs`: If `isCompletingCell`, calculate delay using index and `CASCADE_DELAY_FACTOR`. Use `Math.max`. Default `0`. Add comment explaining `Math.max`.
            *   Determine `currentDuration`: `isCompletingCell ? TRANSITION_DURATIONS.slow : TRANSITION_DURATIONS.fast`.
            *   Construct the inline `transitionStyle` object for *both* `<rect>` and `<text className="guess-text">`:
                ```jsx
                const transitionStyle = {
                    // Base fill color first
                    fill: /* cellFill or textColor */,
                    // Override transition properties
                    transitionProperty: 'fill',
                    transitionDuration: `${currentDuration}ms`,
                    transitionTimingFunction: 'ease-out',
                    transitionDelay: `${cascadeDelayMs}ms`
                };
                // Apply: style={transitionStyle}
                ```
*   **Test:** Verify completion fades: start sequentially (cascade), use the slower duration. Verify focus/highlight remain fast/no delay. Test intersections.
*   **Checkboxes:**
    *   [ ] Constants imported.
    *   [ ] Context consumed.
    *   [ ] `clueInfoMap` created.
    *   [ ] `isCompletingCell` logic correct.
    *   [ ] `cascadeDelayMs` logic correct (inc. `Math.max`, default 0, comment).
    *   [ ] `currentDuration` logic correct.
    *   [ ] Inline `style` object applies correct fill, duration, and delay to `<rect>` and `<text>`.
*   **Notes:** Consider helper `getTransitionStyle(isCompleting, delay)` if logic gets too verbose inline.

---

## 5. Validation & Tuning

*   **Goal:** Ensure correct functionality, visual appeal, cross-browser compatibility, and accessibility.
*   **Steps:**
    1.  **Cross-Browser Testing:** Chrome, Firefox, Safari (desktop/mobile).
    2.  **Functional Testing:** Focus, highlight, single completion, intersection completion – verify correct durations and delays.
    3.  **Visual Tuning:** Adjust `TRANSITION_DURATIONS` and `CASCADE_DELAY_FACTOR` for optimal feel. Validate perceived latency on mobile.
    4.  **Accessibility:** Confirm `prefers-reduced-motion` disables transitions. Check color contrast mid-fade during the *slow* transition.
    5.  **Code Review:** Check for clarity, robustness, use of constants.
    6.  **Testing (Automated):** Unit test `useGameStateManager` state logic. Add integration test asserting visual timing if possible.

---

## 6. Future Considerations (Post-Implementation)

*   **Refactor `CrosswordGrid`:** Extract animation logic (`useCompletionAnimation` hook), consider `CellSVG` component.
*   **CSS Custom Properties:** Migrate inline transition overrides to CSS custom properties for maintainability.
*   **Instrumentation:** Log completion timings.