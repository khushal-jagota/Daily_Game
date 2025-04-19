# Phase 4.75 Plan: Styling & Layout Refinement (Version 2.2 - Enhanced Layout)

**Document Version:** 2.2
**Date:** [Current Date]

## 1. Overall Goal

To refactor the application's layout and styling for a clean, responsive, single-view (`100vh`) experience, applying best practices. This includes significantly restyling the Timer/Progress Bar unit, ensuring the Crossword grid fits correctly, and restyling the Clue display area for a more integrated, NYT-inspired look, using flexible layout techniques.

## 2. Prerequisites

*   Codebase reverted to state after Phase 4.5 completion (or current functional state).
*   Functional Timer & Progress Bar logic exists.
*   Target visual style understood.
*   Theme object provides necessary color variables.

## 3. Implementation Steps

### Step 4.75.1: Apply Global Resets, Box-Sizing & Safe-Area Vars

*   **File:** `src/index.css` (or equivalent global stylesheet)
*   **Goal:** Ensure consistent base styling, box-sizing, and define safe-area CSS variables with fallbacks.
*   **Implementation:**
    *   [ ] **Add/Verify** global reset rules:
        ```css
        *, *::before, *::after {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
        }
        ```
    *   [ ] **Define** CSS custom properties for safe areas with fallbacks:
        ```css
        :root {
          --safe-area-inset-top: 0px;
          --safe-area-inset-right: 0px;
          --safe-area-inset-bottom: 0px;
          --safe-area-inset-left: 0px;
        }
        @supports (padding: env(safe-area-inset-top)) {
          :root {
            --safe-area-inset-top: env(safe-area-inset-top);
            --safe-area-inset-right: env(safe-area-inset-right);
            --safe-area-inset-bottom: env(safe-area-inset-bottom);
            --safe-area-inset-left: env(safe-area-inset-left);
          }
        }
        ```
*   **Test:**
    *   [ ] Load app. Verify no default margins/padding. Verify `box-sizing`. Inspect `:root` element in dev tools - check computed values for `--safe-area-*` variables (should be `0px` fallback or actual `env()` values on relevant devices).
*   **Notes:**
    ```
    {/* CSS Variables for safe areas defined with @supports fallback. */}
    ```

### Step 4.75.2: Implement Full-Viewport Foundation (`AppWrapper`)

*   **File:** `src/Layout/components.ts`
*   **Goal:** Ensure root container fills viewport, uses flex column layout, and applies safe-area padding via CSS variables.
*   **Implementation:**
    *   [ ] **Set/Verify** the following styles for `AppWrapper`:
        ```css
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100%; /* Changed from 100vw based on feedback */
        /* Assumes html, body, #root fill width/height correctly */
        /* box-sizing is global */
        padding-top: var(--safe-area-inset-top);
        padding-right: var(--safe-area-inset-right);
        padding-bottom: var(--safe-area-inset-bottom);
        padding-left: var(--safe-area-inset-left);
        ```
*   **Test:**
    *   [ ] Load app. Inspect `AppWrapper`. Verify `height: 100vh`, `width: 100%`. Verify `padding` uses safe-area variables. **Critically check for horizontal scrollbars** on different viewports (if present, root cause needs investigation). Verify no vertical scrollbar on `AppWrapper` itself.
*   **Notes:**
    ```
    {/* Switched to width: 100%. Using CSS vars for safe-area padding. */}
    ```

### Step 4.75.3: Define Vertical Space Distribution (Layout Components)

*   **File:** `src/Layout/components.ts` (styling definitions for `Banner`, `TimerBarContainer`, `CrosswordArea`, `ClueArea`, `KeyboardArea`)
*   **Goal:** Use `flex` properties for robust vertical sizing, relying on content + padding for height where appropriate. Use `rem` for padding/margins.
*   **Implementation:**
    *   [ ] **`Banner`**: Set `flex: 0 0 auto;` (or `flex-shrink: 0; flex-basis: auto;`). Set vertical `padding` using `rem` (e.g., `padding: 0.75rem 1rem;`) to define its height based on content. Keep background/styles. Remove fixed `height`.
    *   [ ] **`TimerBarContainer`**: Set `flex: 0 0 auto;`. Set vertical `padding` using `rem` (e.g., `padding: 0.5rem 1rem;`). Ensure basic `display: flex`. Remove explicit `margin`.
    *   [ ] **`CrosswordArea`**: Set `flex: 1 1 auto;` (allows grow and shrink, basis is auto). Set `min-height: 0;` (crucial flexbox fix). Set `overflow: hidden;`. Ensure `display: flex`, `justify-content: center`, `align-items: center`. Keep background/styles.
    *   [ ] **`ClueArea`**: Set `flex: 0 0 auto;`. Set vertical `padding` using `rem` (e.g., `padding: 0.5rem 1rem;`). Set `min-height` if needed based on content (e.g., `min-height: 3rem;`). Keep background/styles/display. Remove fixed `height`. Add `overflow: auto;` if content might exceed intrinsic height + padding.
    *   [ ] **`KeyboardArea`**: Set `flex: 0 0 auto;`. Set vertical `padding` using `rem` (e.g., `padding: 1rem;`). Remove fixed `height`. Rely on internal content for height or set a `min-height` in `rem` if needed. Keep background/styles.
*   **Test:**
    *   [ ] Load app. Verify vertical layout. Inspect flex properties. Shrink window height – verify `CrosswordArea` shrinks, others take space based on padding/content. **Verify NO vertical scrollbar on `AppWrapper`.** Test with content in ClueArea to ensure `overflow: auto` works if applied.
*   **Notes:**
    ```
    {/* Replaced fixed heights with flex: 0 0 auto and rem padding. CrosswordArea uses flex: 1 1 auto. Keyboard height is now intrinsic or min-height. */}
    ```

### Step 4.75.4: Reset Timer Styles (`TimerDisplay.tsx`)

*   **File:** `src/Timer/components/TimerDisplay.tsx` (`TimerContainer`)
*   **Goal:** Remove previous appearance/layout styles.
*   **Implementation:**
    *   [ ] Remove all CSS rules inside `TimerContainer`.
*   **Test:**
    *   [ ] View in browser. Timer text unstyled.
*   **Notes:**
    ```
    {/* Reset styles completed. */}
    ```

### Step 4.75.5: Apply New Timer Styles (`TimerDisplay.tsx`)

*   **File:** `src/Timer/components/TimerDisplay.tsx` (`TimerContainer`)
*   **Goal:** Apply stable, responsive text styling.
*   **Implementation:**
    *   [ ] Add specified CSS rules: theme `color`, monospace `font-family`, `font-variant-numeric: tabular-nums`, `font-size: clamp(...)`, `min-width: 5ch`, `text-align: center`.
*   **Test:**
    *   [ ] Verify font, color, clamp(), stable width, centering. No sibling shifts.
*   **Notes:**
    ```
    {/* Using clamp() and min-width: 5ch. */}
    ```

### Step 4.75.6: Reset Progress Bar Styles (`StageProgressBar.tsx`)

*   **File:** `src/Timer/components/StageProgressBar.tsx` (`ProgressBarContainer`, `ProgressBarFill`)
*   **Goal:** Remove appearance styles, keep positioning/transform.
*   **Implementation (`ProgressBarContainer`):**
    *   [ ] Remove `height`, `width`, `background-color`, `border-radius`, `border`, `margin-left`. Keep `position: relative`, `overflow: hidden`.
*   **Implementation (`ProgressBarFill`):**
    *   [ ] Remove `border-radius`. Keep dynamic `background-color`, positioning, transform, transition.
*   **Test:**
    *   [ ] View in browser. Bar area lacks explicit dimensions/backgrounds.
*   **Notes:**
    ```
    {/* Reset styles completed. */}
    ```

### Step 4.75.7: Apply New Progress Bar Styles (`StageProgressBar.tsx`)

*   **File:** `src/Timer/components/StageProgressBar.tsx` (`ProgressBarContainer`, `ProgressBarFill`)
*   **Goal:** Apply fluid, pill-shaped styling.
*   **Implementation (`ProgressBarContainer`):**
    *   [ ] Add `flex-grow: 1;`.
    *   [ ] Add `height: 0.5rem;` (Adjust if needed).
    *   [ ] Add `background-color: ${props => props.theme.progressBarBackground || '#eee'};`.
    *   [ ] Add `border-radius: 999px;`.
*   **Implementation (`ProgressBarFill`):**
    *   [ ] Add `border-radius: 999px;`.
    *   [ ] Verify `transition` is `transform 0.1s linear, background-color 0.3s ease;`.
*   **Implementation (React Component):**
    *   [ ] (Skipped) ARIA attributes deferred.
*   **Test:**
    *   [ ] Verify bar container `flex-grow`, height, background, pill shape. Verify fill radius, color/animation.
*   **Notes:**
    ```
    {/* Pill shape implemented. ARIA deferred. */}
    ```

### Step 4.75.8: Apply Final Timer/Bar Layout (`TimerBarContainer`)

*   **File:** `src/Layout/components.ts` (`TimerBarContainer`)
*   **Goal:** Ensure row layout uses `space-between` and relative spacing.
*   **Implementation:**
    *   [ ] Verify `display: flex;` and `align-items: center;`.
    *   [ ] Set/Verify `justify-content: space-between;`.
    *   [ ] Set/Verify `gap: 1rem;` (Adjust if needed).
    *   [ ] Verify `padding` (e.g., `0.5rem 1rem`).
    *   [ ] Verify `flex: 0 0 auto;` (or `flex-shrink: 0;`).
*   **Test:**
    *   [ ] Verify Timer left, Bar right. Verify gap/padding. Test responsiveness. **Check for horizontal scrollbar.** Address if found (reduce gap/padding, or adjust timer `min-width` via media query if absolutely necessary).
*   **Notes:**
    ```
    {/* Using space-between and gap. Monitor horizontal scrollbar. */}
    ```

### Step 4.75.9: Ensure Responsive Crossword Grid Fitting

*   **File:** `src/Layout/components.ts` (`CrosswordArea`), Styles applied to grid wrapper/SVG.
*   **Goal:** Make grid scale correctly within `CrosswordArea`.
*   **Implementation:**
    *   [ ] Identify immediate wrapper of `<svg>` grid.
    *   [ ] Apply styles to wrapper/svg: `display: block; width: 100%; height: auto; max-width: 100%; aspect-ratio: 1 / 1;`.
    *   [ ] Verify `CrosswordArea` styles: `display: flex; justify-content: center; align-items: center; overflow: hidden;`.
*   **Test:**
    *   [ ] Resize window. Verify grid scales with aspect ratio, stays centered, doesn't overflow container or page.
*   **Notes:**
    ```
    {/* Using aspect-ratio and max-width for grid scaling. */}
    ```

### Step 4.75.10: Restyle `ClueArea`

*   **File:** `src/Layout/components.ts` (`ClueArea`)
*   **Goal:** Make full width, use theme background, flexible height.
*   **Implementation:**
    *   [ ] Remove fixed `background-color: #DDD;`. Apply theme background or transparent.
    *   [ ] Ensure no `width` or `max-width`.
    *   [ ] Update height logic: Use `padding` in `rem` to define height based on content. Keep `flex: 0 0 auto;`. Add `overflow: auto;`. Remove fixed `height`. Add `min-height` in `rem` if needed.
    *   [ ] Set `padding` using `rem` (e.g., `padding: 0.75rem 1rem;`).
*   **Test:**
    *   [ ] Verify width, background, height/padding. Test overflow with long clues.
*   **Notes:**
    ```
    {/* Removed fixed height, using padding. Set theme background/transparent. */}
    ```

### Step 4.75.11: Restyle `ClueVisualiser`

*   **File:** `src/Crossword/components/ClueVisualiser.tsx` (and its styled components)
*   **Goal:** Apply theme styling, ensure good layout within wider `ClueArea`.
*   **Implementation:**
    *   [ ] Update internal styled components.
    *   [ ] Apply `color: ${props => props.theme.textColor};`.
    *   [ ] Apply theme `font-family`.
    *   [ ] Apply `font-size` using `rem`.
    *   [ ] Ensure `text-align: left;` (or center). Adjust internal padding/margins.
*   **Test:**
    *   [ ] Verify clue text styling/readability within `ClueArea`.
*   **Notes:**
    ```
    {/* Aligned fonts/colors with theme. Adjusted padding. */}
    ```
# Phase 4.75 Plan: Layout Refactor to CSS Grid & Styling Polish (Version 3.1)

**Document Version:** 3.1
**Date:** [Current Date]

## 1. Overall Goal

Refactor the application's root layout to use **CSS Grid** for robust vertical space distribution, ensuring a no-scroll experience using **modern viewport units (`svh`/`dvh`)** and **safe-area handling**. Ensure reliable minimum space for all sections (including the keyboard placeholder) using **flexible `minmax()` and `clamp()` definitions**. Polish component styling for a clean, responsive, integrated look. Accessibility features beyond basic styling and advanced QA automation are deferred.

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
    *   [ ] **Verify** `*, *::before, *::after { box-sizing: border-box; }` exists.
    *   [ ] **Verify** `html, body { margin: 0; padding: 0; height: 100%; }`.
    *   [ ] **Verify** `#root` (or app mount point) styles are minimal (e.g., `height: 100%;`) and **do not include `display: flex`**.
    *   [ ] **Add/Verify** CSS Variables for safe area insets with `0px` fallbacks and `@supports` override:
        ```css
        :root {
          --safe-area-inset-top: 0px;
          --safe-area-inset-right: 0px;
          --safe-area-inset-bottom: 0px;
          --safe-area-inset-left: 0px;
        }
        @supports (padding-top: env(safe-area-inset-top)) {
          :root {
            --safe-area-inset-top: env(safe-area-inset-top);
            --safe-area-inset-right: env(safe-area-inset-right);
            --safe-area-inset-bottom: env(safe-area-inset-bottom);
            --safe-area-inset-left: env(safe-area-inset-left);
          }
        }
        ```
*   **Test:**
    *   [ ] Quick visual check for resets. Use Dev Tools to confirm variables defined.
*   **Notes:**
    ```
    {/* Confirmed foundational CSS is correct, removed flex from #root. Acknowledged TODO: Use logical properties (padding-inline-*, padding-block-*) for full RTL support in future refactor. */}
    ```

### Step 4.75.13: Refactor `AppWrapper` to CSS Grid & Apply Viewport Units/Safe Areas

*   **File:** `src/Layout/components.ts` (`AppWrapper`)
*   **Goal:** Switch main container to CSS Grid, use robust viewport units (`svh`/`dvh`), apply safe areas via variables, define flexible row tracks.
*   **Implementation:**
    *   [ ] **Modify** `AppWrapper` styles:
        ```css
        export const AppWrapper = styled.div`
          display: grid; /* SWITCH TO GRID */
          grid-template-rows:
            auto                                     /* Banner (sized by padding/content) */
            auto                                     /* TimerBarContainer (sized by padding/content) */
            1fr                                      /* CrosswordArea (takes remaining space) */
            minmax(clamp(2.5rem, 5vh, 4rem), auto)    /* ClueArea (flexible min height) - ADJUST clamp values */
            minmax(clamp(6rem, 20vh, 10rem), auto)    /* KeyboardArea (flexible min height) - ADJUST clamp values */
            ; 
          /* Use svh with dvh fallback for viewport height */
          min-height: 100dvh; 
          @supports (min-height: 100svh) {
            min-height: 100svh;
          }
          width: 100%; 
          /* Apply safe-area padding using CSS variables */
          padding-top: var(--safe-area-inset-top);
          padding-right: var(--safe-area-inset-right);
          padding-bottom: var(--safe-area-inset-bottom);
          padding-left: var(--safe-area-inset-left);
          gap: 0; /* Explicitly no gap between grid rows */
          overflow: hidden; /* Prevent AppWrapper itself from scrolling */
        `;
        ```
*   **Test:**
    *   [ ] Load app. Inspect `AppWrapper` to verify `display: grid`, `grid-template-rows`, `svh`/`dvh` usage. Check safe area padding effect.
    *   [ ] Test row sizing with `clamp()` on various **short viewports** (mobile landscape, resized desktop). Verify **NO vertical scrollbar on the page**. Adjust `clamp()` values iteratively until balanced and fitting.
*   **Notes:**
    ```
    {/* Switched AppWrapper to Grid. Implemented svh/dvh fallback. Used clamp() within minmax() for flexible row heights. Set explicit gap: 0. Recorded final clamp() values. Confirmed no page scroll. */}
    ```

### Step 4.75.14: Remove Old Flex Props from Grid Items

*   **File:** `src/Layout/components.ts` (`Banner`, `TimerBarContainer`, `CrosswordArea`, `ClueArea`, `KeyboardArea`)
*   **Goal:** Clean up obsolete Flexbox sizing properties now that parent is Grid.
*   **Implementation:**
    *   [ ] **Delete** (do not comment out) `flex: 0 0 auto;` from `Banner`, `TimerBarContainer`, `ClueArea`, `KeyboardArea`.
    *   [ ] **Delete** `flex: 1 1 auto;` and `min-height: 0;` from `CrosswordArea`.
*   **Test:**
    *   [ ] Verify layout still holds via Grid definition. Check Dev Tools to confirm `flex` properties are gone.
*   **Notes:**
    ```
    {/* DELETED obsolete flex properties from Grid items. */}
    ```

### Step 4.75.15: Style & Verify `KeyboardArea` Placeholder Size

*   **File:** `src/Layout/components.ts` (`KeyboardArea`)
*   **Goal:** Ensure keyboard placeholder is visible and correctly occupies its defined minimum grid space.
*   **Implementation:**
    *   [ ] Verify/Set `background-color` (e.g., `theme.colors.keyboardBackground || '#EEE';`).
    *   [ ] Verify/Set internal `padding` using `rem` (e.g., `padding: 0.5rem;`).
    *   [ ] Add `overflow: hidden;`.
    *   [ ] *(Optional)* Add placeholder text/border for testing visibility.
*   **Test:**
    *   [ ] Verify `KeyboardArea` visible at bottom. Verify its height corresponds to the minimum set in `grid-template-rows`' `minmax(clamp(...))` on various screen heights.
*   **Notes:**
    ```
    {/* Styled KeyboardArea placeholder. Height correctly determined by grid row definition and clamp(). */}
    ```

### Step 4.75.16: Verify Crossword Grid Fitting in Grid Context

*   **File:** `src/Layout/components.ts` (`CrosswordArea`), `src/Crossword/styles/CrosswordStyles.ts` (`CrosswordWrapper`)
*   **Goal:** Confirm the square crossword grid centers and scales correctly within its `1fr` grid row.
*   **Implementation:**
    *   [ ] **Verify** `CrosswordArea` styles: `display: flex; justify-content: center; align-items: center; overflow: hidden;`.
    *   [ ] **Verify** `CrosswordWrapper` (or the element it applies to) styles: `display: block; width: 100%; height: auto; max-width: 100%; aspect-ratio: 1 / 1; overflow: hidden;` (and internal overrides remain removed). Consider adding `max-height: 100%` to `CrosswordWrapper` for extra safety within the flex centering.
*   **Test:**
    *   [ ] Resize browser window (width and height). Verify `CrosswordArea` track flexes. Verify grid wrapper stays square, centered. Check SVG scaling (accept internal limitations if necessary).
*   **Notes:**
    ```
    {/* Grid wrapper aspect-ratio maintained. Centering within CrosswordArea track confirmed. Added max-height: 100% to wrapper. Internal SVG scaling limitation noted (if applicable). */}
    ```

### Step 4.75.17: Verify Final Component Styles & Layout

*   **Files:** All relevant layout and component files.
*   **Goal:** Final check of all previously styled components within the new Grid layout.
*   **Implementation:**
    *   [ ] Review `Banner`, `TimerBarContainer`, `TimerDisplay`, `StageProgressBar`, `ClueArea`, `ClueVisualiser`.
    *   [ ] Ensure their individual styles (colors, fonts, padding, responsive timer font/width, progress bar shape/animation etc.) still look correct. Make minor tweaks if layout changes affected them.
*   **Test:**
    *   [ ] Holistic visual review of the entire application layout. Check proportions, spacing, alignment.
    *   [ ] **Perform Real Device Testing:** Mandatory check on target iOS and Android devices (portrait and landscape). Pay close attention to safe areas and keyboard area height.
    *   [ ] **Perform Zoom Testing:** Use browser zoom and OS accessibility zoom to check for layout breakage or usability issues.
*   **Notes:**
    ```
    {/* Final visual pass complete. Layout holds up on different devices/zoom levels. Real device testing passed. */}
    ```

## 4. Deliverables

*   Refactored `AppWrapper` using CSS Grid, `svh`/`dvh`, and flexible row definitions.
*   Updated layout components compatible with Grid layout.
*   Styled `KeyboardArea` placeholder defining minimum flexible space.
*   Verified styling of Timer, Progress Bar, Clue display, and Crossword grid within the new layout.
*   Updated Manual Testing Checklist (emphasizing viewport variations, real devices, zoom).

## 5. Estimate

*   ~1-2 Developer Days (includes Grid refactor, styling verification, and more rigorous testing).

---

This plan (v3.1) represents the most robust approach based on the feedback received.
## 4. Deliverables

*   Updated layout components, `TimerDisplay`, `StageProgressBar`, `ClueVisualiser`, grid wrapper styles adhering to responsive best practices.
*   Updated Manual Testing Checklist including checks for responsiveness, layout stability, safe areas, and specific styling targets.

## 5. Estimate

*   ~1-2 Developer Days.

---