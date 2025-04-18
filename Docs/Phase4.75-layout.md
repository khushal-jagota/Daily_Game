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

## 4. Deliverables

*   Updated layout components, `TimerDisplay`, `StageProgressBar`, `ClueVisualiser`, grid wrapper styles adhering to responsive best practices.
*   Updated Manual Testing Checklist including checks for responsiveness, layout stability, safe areas, and specific styling targets.

## 5. Estimate

*   ~1-2 Developer Days.

---