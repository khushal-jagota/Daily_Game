# Project Summary: Phase 4 Block (Timer, Staging, Layout Refactor)

**Document Version:** 1.0
**Date:** [Current Date]
**Phases Covered:** 4.0 (Timer & Staging), 4.5 (Stage Progress Bar), 4.75 (Layout Refactor & Styling)

## 1. Introduction / Overall Goal

This document summarizes the significant development work undertaken across Phases 4.0, 4.5, and 4.75. The primary goals of this block were to:

1.  Implement the core timing and multi-stage completion mechanics central to the game's concept.
2.  Provide clear visual feedback to the user regarding time elapsed and current completion stage.
3.  Refactor the application's layout architecture for robustness, responsiveness, and maintainability, adopting modern CSS practices to achieve a clean, single-view (`100vh`), no-scroll experience suitable for multiple device types.
4.  Polish the visual styling of key UI components for better aesthetic integration.

## 2. Key Features Implemented

*   **User-Initiated Timer:** Game starts via a "Start Game" button (`isGameStarted` state in `App.tsx`).
*   **Elapsed Time Tracking:** A dedicated `useTimer` hook tracks elapsed time precisely.
*   **Multi-Stage Completion Logic:**
    *   `useTimer` calculates the current stage (1-5) based on predefined time thresholds (`STAGE_THRESHOLDS`).
    *   `useGameStateManager` updated to store completion data as `Map<string, { stage: number }>`, recording the stage upon word completion.
*   **Stage-Based Visual Feedback:**
    *   Completed cells (`Cell.tsx`) are colored based on their recorded completion stage using theme variables.
    *   `TimerDisplay` text color changes dynamically based on the *current* stage.
    *   `StageProgressBar` fill color changes dynamically based on the *current* stage.
*   **Timer Display (`TimerDisplay.tsx`):** Shows time in `MM:SS` format. Uses responsive, monospace font (`ui-monospace`, `tabular-nums`) with stable width (`min-width: 5ch`) and dynamic text color. Freezes on game completion.
*   **Stage Progress Bar (`StageProgressBar.tsx`):** Displays time remaining within the current stage via a horizontal bar that depletes from left-to-right. Uses theme colors, responsive sizing (`rem`), and a pill shape. Freezes on game completion. Integrated alongside the Timer.
*   **Layout Foundation:** Basic layout structure established with distinct areas (`Banner`, `TimerBarContainer`, `CrosswordArea`, `ClueArea`, `KeyboardArea`).
*   **Keyboard Placeholder:** `KeyboardArea` reserves minimum vertical space in the final layout, ready for future implementation.

## 3. Key Architectural Changes & Refinements

*   **State Management (`useGameStateManager`):** Refactored `completedWords` state from `Set<string>` to `Map<string, { stage: number }>` to store stage data. Integration logic added via `App.tsx` wrappers to pass stage info from `useTimer` to state actions. Added `isGameComplete` calculation.
*   **Timing Logic (`useTimer`):** Encapsulated timer counting, stage calculation, stage progress ratio calculation, and freeze-on-completion logic. Uses precise time internally (`setInterval` at 100ms, storing fractional seconds) while exposing whole seconds for display.
*   **Layout Engine (Phase 4.75):** **Major refactor from Flexbox to CSS Grid** for the root `AppWrapper`.
    *   Uses `display: grid` and `grid-template-rows` (`auto`, `1fr`, `minmax(clamp(...), auto)`) for explicit, robust vertical space distribution.
*   **Viewport Handling (Phase 4.75):** `AppWrapper` uses `min-height: 100svh` (with `100dvh` fallback) and `width: 100%` for reliable full-viewport rendering across devices, preventing unexpected overflow caused by mobile browser UI changes.
*   **Safe Area Handling (Phase 4.75):** Implemented robust safe area inset padding on `AppWrapper` using CSS variables (`--safe-area-inset-*`) populated by `env()` with `0px` fallbacks.
*   **Responsive Sizing (Phase 4.75):** Shifted away from fixed heights (`px` or even simple `rem`) for layout rows. Adopted `flex: 0 0 auto` (initially, then removed for Grid) combined with `rem`-based padding for content-sized rows, and `minmax(clamp(MIN_REM, PREFERRED_VH, MAX_REM), auto)` for flexible minimum heights in Grid rows (`ClueArea`, `KeyboardArea`). `clamp()` used for responsive font sizing (`TimerDisplay`). `ch` unit used for stable timer width.
*   **Component Styling (Phase 4.75):** Refined Timer, Progress Bar, Clue Area, and Clue Visualiser using theme variables, relative units, modern typography, and alignment techniques for a cleaner, more integrated look. Styling reset steps were used for a clean application.
*   **Crossword Grid Fitting (Phase 4.75):** Applied styles (`width: 100%`, `aspect-ratio: 1/1`, etc.) to the `CrosswordWrapper` to ensure the grid container scales correctly within its flexible grid track (`CrosswordArea`).

## 4. Final State (Post-Phase 4.75)

*   The application renders within the full viewport height without page scrollbars, adapting to different screen sizes and safe areas.
*   The layout is controlled by CSS Grid, providing distinct, proportionally sized rows for key UI sections.
*   The Timer and Stage Progress Bar are visually polished, responsive, functionally complete (including start/stop/freeze), and provide clear stage feedback.
*   Completed crossword cells display stage-based colors.
*   The Clue display area is styled consistently with the theme.
*   The Crossword grid container scales correctly, maintaining its aspect ratio.
*   A placeholder area reserves appropriate minimum space for the future keyboard.
*   The codebase utilizes modern CSS features (`svh`/`dvh`, `clamp`, `ch`, `minmax`, Grid, CSS variables) and relative units (`rem`).

## 5. Key Decisions & Learnings

*   **CSS Grid Adoption:** The decision to refactor to CSS Grid (over Flexbox with `min-height` hacks) was made for superior layout control, robustness, and maintainability, despite slightly higher initial effort.
*   **Modern Viewport Units:** Recognizing the limitations of `100vh` and adopting `100svh`/`100dvh` was critical for reliable mobile layout.
*   **Flexible Row Sizing:** Using `minmax(clamp(...))` proved essential for balancing minimum space requirements (like for the Keyboard) with responsiveness on short screens.
*   **Timer Stability:** Implementing `min-width` with `ch` units and `tabular-nums` fonts was necessary to prevent layout shifts.
*   **Iterative Refinement:** Achieving the final layout and styling required several iterations (e.g., fixing progress bar drain, adjusting row sizing methods, polishing component aesthetics).
*   **Deferred Items:** Conscious decisions were made to defer `requestAnimationFrame` for smoothness, advanced ARIA implementation, automated testing, and `CrosswordCore` investigation/refactoring, acknowledging these as technical debt or future work.

## 6. Next Steps

With the core timing mechanics implemented and the layout/styling foundation significantly improved and stabilized, the project is now well-positioned to proceed with **Phase 5: Share Feature (Canvas PNG)**.

---