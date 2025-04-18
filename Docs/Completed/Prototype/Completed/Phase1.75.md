# Prototype Implementation: Phase 1.75 - Basic Application Layout Scaffolding (Mobile-First)

**Goal:** Create the minimal structural components using `styled-components` to arrange the main application areas (Banner, Crossword, Clue, Keyboard Placeholder) within the viewport, ensuring the crossword grid renders visibly in its designated area without causing page scroll, primarily targeting a mobile-like view.

**Prerequisite:** Phase 1.5 completed. Theme system consolidated. `CrosswordProvider` and `CrosswordGrid` are ready to render but may be invisible due to lack of layout sizing in `App.tsx`.

---

## Step 1.75.1: Define Layout Component File

*   **Scope:**
    Create a dedicated directory and file for our layout-specific styled components.

*   **Reason:**
    To maintain project modularity by separating layout concerns from feature components (e.g., Crossword) and application logic (`App.tsx`), adhering to our established project structure principles.

*   **Implementation:**
    1.  Create a new directory: `src/Layout`.
    2.  Create a new file within it: `src/Layout/components.ts`.

*   **Test:**
    *   File System Check: Verify the `src/Layout` directory and the `src/Layout/components.ts` file exist in the project structure.

*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked

*   **Notes:**
    ```
    Created src/Layout directory and src/Layout/components.ts file to hold layout-specific styled components. This keeps layout concerns separate from feature components and application logic.
    ```

---

## Step 1.75.2: Implement Basic Layout Components

*   **Scope:**
    Define the core styled components (`AppWrapper`, `Banner`, `CrosswordArea`, `ClueArea`, `KeyboardArea`) within `src/Layout/components.ts`, using basic Flexbox and height constraints to achieve the desired vertical stacking and sizing.

*   **Reason:**
    To establish the fundamental visual structure of the application, ensuring elements fit within the viewport without scrolling (mobile-first focus). Critically, this provides a sized container (`CrosswordArea`) which allows the `CrosswordWrapper` and `CrosswordGrid` to render visibly by resolving their percentage/aspect-ratio sizing.

*   **Implementation:**
    1.  Open `src/Layout/components.ts`.
    2.  Import `styled` from `styled-components`.
    3.  Define and export `AppWrapper` (`div`):
        *   Set `display: flex;`
        *   Set `flex-direction: column;`
        *   Set `height: 100vh;` (Consider `100dvh` later for edge cases, stick to `100vh` for simplicity now).
        *   Set `overflow: hidden;` (Crucial to prevent scrolling).
    4.  Define and export `Banner` (`div`):
        *   Set a fixed `height` (e.g., `50px`).
        *   Set a placeholder `background-color` (e.g., `#CCC`).
        *   Set `flex-shrink: 0;` (Prevent this area from shrinking).
    5.  Define and export `CrosswordArea` (`div`):
        *   Set `flex-grow: 1;` (Allow this area to take up remaining vertical space).
        *   Set `display: flex;`
        *   Set `justify-content: center;`
        *   Set `align-items: center;`
        *   Set `padding: 10px;` (Optional spacing).
        *   Set `overflow: hidden;` (Prevent grid overflowing its area).
        *   *Note: This component's calculated height from Flexbox will provide the context for the crossword grid's sizing.*
    6.  Define and export `ClueArea` (`div`):
        *   Set a fixed `height` (e.g., `70px`).
        *   Set a placeholder `background-color` (e.g., `#DDD`).
        *   Set `flex-shrink: 0;`
        *   Optionally add basic flex properties for centering placeholder text: `display: flex; align-items: center; justify-content: center;`
    7.  Define and export `KeyboardArea` (`div`):
        *   Set a fixed `height` (e.g., `200px`, adjust as needed).
        *   Set a placeholder `background-color` (e.g., `#EEE`).
        *   Set `flex-shrink: 0;`

*   **Test:**
    *   Code Review: Do the styles correctly implement a vertical Flexbox layout? Are heights defined (fixed or flexible via `flex-grow`)? Does `AppWrapper` have `height: 100vh` and `overflow: hidden`? Does `CrosswordArea` have `flex-grow: 1`?

*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked

*   **Notes:**
    ```
    Implemented basic styled components using Flexbox column layout for AppWrapper, defined fixed heights for Banner/Clue/Keyboard and flex-grow for CrosswordArea. All components use the required CSS properties to ensure proper mobile display without scrolling.
    ```

---

## Step 1.75.3: Integrate Layout in `App.tsx`

*   **Scope:**
    Modify `App.tsx` to import and utilize the new layout components, structuring the application's JSX to place the `ThemeProvider`, `CrosswordProvider`, and `CrosswordGrid` within the appropriate layout areas.

*   **Reason:**
    To apply the newly defined layout structure to the running application, replacing the previous flat structure.

*   **Implementation:**
    1.  Open `src/App.tsx`.
    2.  Import the necessary layout components from `src/Layout/components.ts` (e.g., `AppWrapper`, `Banner`, `CrosswordArea`, `ClueArea`, `KeyboardArea`).
    3.  Wrap the entire returned JSX in `<AppWrapper>`.
    4.  Inside `AppWrapper`, arrange the components in order: `<Banner>`, `<CrosswordArea>`, `<ClueArea>`, `<KeyboardArea>`.
    5.  Place the existing `<ThemeProvider>` and its children (`<CrosswordProvider>` containing `<CrosswordGrid>`) *inside* the `<CrosswordArea>` component.
    6.  Add simple placeholder text or content inside `<Banner>`, `<ClueArea>`, `<KeyboardArea>` if desired for visual confirmation.

*   **Test:**
    *   Code Review: Does the JSX structure in `App.tsx` correctly match the intended layout hierarchy (`AppWrapper` > `Banner`, `CrosswordArea`, etc.)? Is the `CrosswordProvider`/`Grid` nested within `CrosswordArea`?

*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked

*   **Notes:**
    ```
    Updated App.tsx to use the new layout components, placing the crossword components within CrosswordArea. Added placeholder text for Banner, ClueArea and KeyboardArea for visual confirmation of the layout structure.
    ```

---

## Step 1.75.4: Test Layout and Grid Visibility

*   **Scope:**
    Run the application and visually verify that the basic layout structure renders correctly, the crossword grid is now visible within its designated area, and the overall page does not scroll vertically, especially in a simulated mobile viewport.

*   **Reason:**
    To confirm that the layout scaffolding successfully achieves its primary goals: providing visual structure, solving the grid visibility/sizing issue, and adhering to the single-page constraint.

*   **Implementation:**
    1.  Ensure all changes are saved.
    2.  Run the application using `npm run dev`.
    3.  Open the application in a browser.
    4.  Use browser developer tools to switch to a mobile device emulation mode (e.g., iPhone 12/13).

*   **Test:**
    *   Visual Layout Check: Are the distinct areas (Banner, Crossword, Clue, Keyboard) visible, likely with their placeholder background colors? Do they stack vertically?
    *   Grid Visibility Check: Is the crossword grid SVG clearly visible *within* the boundaries of the `CrosswordArea`?
    *   No Scrolling Check: Is there *any* vertical scrollbar present for the main page/document within the mobile viewport? The entire layout should fit.
    *   DOM/Style Inspection (if needed): If the grid is still not visible or layout is wrong, inspect the computed `height` of `AppWrapper` (should be viewport height) and `CrosswordArea` (should be a calculated pixel value). Inspect the `CrosswordWrapper` inside `CrosswordArea` - does it now have non-zero dimensions?

*   **Check:**
    *   [x] Code Completed
    *   [x] Test Checked

*   **Notes:**
    ```
    Ran app in mobile view. Layout sections are visible and stacked vertically with the proper background colors. Grid is now clearly visible inside CrosswordArea with appropriate dimensions. No vertical scrolling appears on the page. The layout scaffolding successfully meets all requirements.
    ```

---