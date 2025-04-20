# Phase 4.75 Plan: Layout Refactor to CSS Grid & Styling Polish (Version 3.1 - COMPLETED)

**Document Version:** 3.1 - Completed
**Date:** [Completion Date]

## 1. Overall Goal

Refactor the application's layout and styling for a clean, responsive, single-view (`100vh`) experience, applying best practices. This includes significantly restyling the Timer/Progress Bar unit using flexible/relative sizing, ensuring the Crossword grid fits correctly, and restyling the Clue display area for a more integrated, NYT-inspired look. Accessibility features beyond basic styling and advanced QA automation are deferred.

## 2. Prerequisites

*   Current codebase state (styling up to 4.75.11 applied, but vertical layout based on Flexbox is problematic).
*   Functional Timer & Progress Bar logic exists.
*   Target visual style understood.
*   Theme object provides necessary color variables.

## 3. Implementation Steps

### Step 4.75.12: Verify Global Resets & Define Safe-Area Variables

*   **File:** `src/index.css`
*   **Goal:** Confirm base resets and define CSS variables for safe areas with fallbacks.
*   **Implementation:**
    *   [x] **Verify** `*, *::before, *::after { box-sizing: border-box; }` exists.
    *   [x] **Verify** `html, body { margin: 0; padding: 0; height: 100%; }` and `#root { height: 100%; display: flex; flex-direction: column; }`. **Correction:** Removed `display:flex` from `#root`.
    *   [x] **Add/Verify** CSS Variables for safe area insets with `0px` fallbacks and `@supports` override.
*   **Test:**
    *   [x] Quick visual check for resets. Use Dev Tools to confirm variables defined.
*   **Notes:**
    ```
    Confirmed foundational CSS is correct, removed flex from #root. Ensured html/body/root height allows AppWrapper to fill viewport. Safe-area variables implemented with fallbacks. Acknowledged TODO: Use logical properties (padding-inline-*, padding-block-*) for full RTL support in future refactor.
    ```

### Step 4.75.13: Refactor `AppWrapper` to CSS Grid & Apply Viewport Units/Safe Areas

*   **File:** `src/Layout/components.ts` (`AppWrapper`)
*   **Goal:** Switch main container to CSS Grid, use robust viewport units (`svh`/`dvh`), apply safe areas via variables, define flexible row tracks.
*   **Implementation:**
    *   [x] **Modify** `AppWrapper` styles: Set `display: grid;`. Implemented `grid-template-rows` with `auto`, `1fr`, and `minmax(clamp(...), auto)` tracks. Set `min-height` with `100dvh` base and `100svh` `@supports` override. Set `width: 100%`. Applied safe-area padding using CSS variables. Added `gap: 0;` and `overflow: hidden;`.
        ```css
         /* Final Grid Template Rows Example: */
         grid-template-rows:
            auto                                     /* Banner */
            auto                                     /* TimerBar */
            1fr                                      /* Crossword */
            minmax(clamp(2.5rem, 5vh, 4rem), auto)    /* ClueArea - Final Value */
            minmax(clamp(7rem, 20vh, 9rem), auto)    /* KeyboardArea - Final Value */
            ; 
        ```
*   **Test:**
    *   [x] Verified Grid layout, `svh`/`dvh` usage, safe areas via Dev Tools. Tested row sizing with `clamp()` on various **short viewports**. Adjusted clamp values iteratively. **Confirmed NO vertical scrollbar on the page**.
*   **Notes:**
    ```
    Successfully switched AppWrapper to Grid. Implemented svh/dvh fallback. Used clamp() within minmax() for flexible row heights after testing/tuning values. Set explicit gap: 0. Confirmed no page scroll on target viewports (e.g., iPhone SE landscape).
    ```

### Step 4.75.14: Remove Old Flex Props from Grid Items

*   **File:** `src/Layout/components.ts` (`Banner`, `TimerBarContainer`, `CrosswordArea`, `ClueArea`, `KeyboardArea`)
*   **Goal:** Clean up obsolete Flexbox sizing properties now that parent is Grid.
*   **Implementation:**
    *   [x] **Deleted** `flex: 0 0 auto;` from `Banner`, `TimerBarContainer`, `ClueArea`, `KeyboardArea`.
    *   [x] **Deleted** `flex: 1 1 auto;` and `min-height: 0;` from `CrosswordArea`.
*   **Test:**
    *   [x] Verified layout still holds via Grid definition. Checked Dev Tools to confirm `flex` properties are gone.
*   **Notes:**
    ```
    DELETED obsolete flex properties from Grid items. Layout correctly controlled by grid-template-rows.
    ```

### Step 4.75.15: Style & Verify `KeyboardArea` Placeholder Size

*   **File:** `src/Layout/components.ts` (`KeyboardArea`)
*   **Goal:** Ensure keyboard placeholder is visible and correctly occupies its defined minimum grid space.
*   **Implementation:**
    *   [x] Set `background-color` using theme variable/fallback (`#EEE`).
    *   [x] Set internal `padding` using `rem` (e.g., `padding: 0.5rem;`).
    *   [x] Added `overflow: hidden;`.
    *   [x] Added temporary placeholder text for visibility during testing.
*   **Test:**
    *   [x] Verified `KeyboardArea` visible at bottom. Verified height corresponds to `minmax(clamp(...))` definition across screen heights.
*   **Notes:**
    ```
    Styled KeyboardArea placeholder. Height correctly determined by grid row definition and clamp(). Placeholder text added for testing, to be removed later.
    ```

### Step 4.75.16: Verify Crossword Grid Fitting in Grid Context

*   **File:** `src/Layout/components.ts` (`CrosswordArea`), `src/Crossword/styles/CrosswordStyles.ts` (`CrosswordWrapper`)
*   **Goal:** Confirm the square crossword grid centers and scales correctly within its `1fr` grid row.
*   **Implementation:**
    *   [x] **Verified** `CrosswordArea` styles: `display: flex; justify-content: center; align-items: center; overflow: hidden;`. Set background to theme color.
    *   [x] **Verified** `CrosswordWrapper` styles: `display: block; width: 100%; height: auto; max-width: 100%; aspect-ratio: 1 / 1; overflow: hidden;`. Added `max-height: 100%;`. Internal overrides remain removed.
*   **Test:**
    *   [x] Resized window. Verified `CrosswordArea` track flexes. Verified grid wrapper stays square, centered. SVG scaling limitation (due to CrosswordCore internals) noted but accepted for now. Wrapper itself sizes correctly.
*   **Notes:**
    ```
    Grid wrapper aspect-ratio maintained. Centering within CrosswordArea grid track confirmed. Added max-height: 100% to wrapper. Internal SVG scaling limitation noted as deferred work related to CrosswordCore.
    ```

### Step 4.75.17: Verify Final Component Styles & Layout

*   **Files:** All relevant layout and component files.
*   **Goal:** Final check of all previously styled components within the new Grid layout context.
*   **Implementation:**
    *   [x] Reviewed `Banner`, `TimerBarContainer`, `TimerDisplay`, `StageProgressBar`, `ClueArea`, `ClueVisualiser`. Made minor padding adjustments for visual balance.
*   **Test:**
    *   [x] Holistic visual review performed. Proportions, spacing, alignment satisfactory.
    *   [x] **Performed Real Device Testing:** Tested on iPhone (Safari) and Android (Chrome) in portrait/landscape. Layout holds, safe areas respected.
    *   [x] **Performed Zoom Testing:** Checked browser zoom up to 150-200%. Layout remains usable, text readable. OS zoom checked briefly.
*   **Notes:**
    ```
    Final visual pass complete. Layout holds up on different devices/zoom levels. Real device testing passed. Phase 4.75 considered complete.
    ```

## 4. Deliverables

*   Refactored `AppWrapper` using CSS Grid, `svh`/`dvh`, and flexible row definitions.
*   Updated layout components (`Banner`, `TimerBarContainer`, etc.) compatible with Grid layout.
*   Styled `KeyboardArea` placeholder defining minimum flexible space.
*   Verified styling of Timer, Progress Bar, Clue display, and Crossword grid within the new layout.
*   Updated Manual Testing Checklist (emphasizing viewport variations, real devices, zoom).

## 5. Estimate

*   ~1-2 Developer Days (Actual: [Record actual time if desired])

---