# Project Structure: Themed Crossword Game (Updated Post-Phase 5)

## Executive Summary

This document outlines the project structure for the themed crossword game, emphasizing feature-based modularity. The core architecture centers around a central **`useGameStateManager` custom hook** (`src/GameFlow/state/`), which manages all dynamic game state. UI rendering leverages reused **`CrosswordCore`** components controlled via the **`ThemedCrossword`** adapter (`src/Crossword/components/`).

A significant change implemented in Phase 4.75 is the adoption of **CSS Grid for the main application layout**. The root **`AppWrapper`** component (`src/Layout/components.ts`) now uses `display: grid` and `grid-template-rows` to explicitly define vertical sections for the banner, timer/bar, crossword area, clue area, and keyboard area. This ensures a robust **single-view layout** confined to the viewport height using modern units (`min-height: 100svh` with `100dvh` fallback) and handling **safe area insets** via CSS variables. Row sizing uses `auto`, `1fr`, and `minmax(clamp(...), auto)` for responsive and predictable space allocation. **`App.tsx`** remains the orchestrator, initializing hooks and rendering the main components within this Grid structure.

Phase 5 introduces the **virtual keyboard** feature using the `react-simple-keyboard` library. The keyboard implementation follows a responsive design approach with optimized spacing and styling that integrates seamlessly with the application theme. A new **focus management system** has been implemented that uses a direct reference to the hidden input element in the crossword grid, allowing for seamless interaction between virtual and physical keyboards.

Styling relies on **`styled-components`**, with theme values defined (`src/Crossword/styles/CrosswordStyles.ts`, `src/styled.d.ts`). The Timer/Bar unit, Clue display, and Keyboard have been styled for a clean, responsive look using theme variables and relative units (`rem`, `clamp`, `ch`). Manual testing remains the primary validation strategy, now including checks across various viewports and real devices.

**Key Considerations & Current State (Post-Phase 5):**
*   **Layout Engine:** Changed from Flexbox column to **CSS Grid** (`grid-template-rows`) in `AppWrapper` for primary vertical layout control.
*   **Viewport Handling:** Uses `min-height: 100svh/dvh` and `env(safe-area-inset-*)` padding via CSS variables for robust full-screen rendering.
*   **Row Sizing:** Uses `auto`, `1fr`, and `minmax(clamp(MIN_REM, PREFERRED_VH, MAX_REM), auto)` for flexible but constrained row heights.
*   **Component Styling:** Timer (`TimerDisplay`), Progress Bar (`StageProgressBar`), Clue display (`ClueVisualiser`), and Keyboard (`VirtualKeyboard`) have been styled using responsive units (`rem`, `clamp`), theme colors, and modern typography. Timer width is stabilized (`min-width: 5ch`). Progress bar uses `flex-grow: 1` within its row.
*   **Crossword Fitting:** Styles applied to ensure the grid wrapper (`CrosswordWrapper`) maintains a `1:1` aspect ratio and scales within the `1fr` `CrosswordArea` grid track.
*   **Virtual Keyboard:** Fully implemented using `react-simple-keyboard` with custom styling, responsive layout, and QWERTY key arrangement. Optimized for maximum usable space with minimal padding and efficient key spacing.
*   **Focus Management:** Refactored to use a direct reference to the hidden input element retrieved via a callback pattern, enabling seamless interaction between virtual keyboard input and physical keyboard input.
*   **State Management:** Still centered on `useGameStateManager`, now with keyboard input connected to appropriate state actions (`handleGuessInput`, `handleBackspace`).
*   **Core Components:** Modified `CrosswordGrid` to use the ref callback pattern instead of the previous focus registration mechanism.
*   **Testing:** Manual testing with expanded scope to include the keyboard interaction, covering key press, focus management, and accessibility across different devices and viewports.

**Overall:** The application now provides a complete touch-friendly interface with the virtual keyboard implementation, making it fully usable on mobile and tablet devices without requiring a physical keyboard. The layout has been optimized for space efficiency while maintaining usability.

---

## Project Directory Structure (Post-Phase 5)

```plaintext
new-themed-crossword/
├── functions/                  # Firebase Cloud Functions (Future)
├── node_modules/               # Dependencies (excluded via .gitignore)
├── public/                     # Static assets
│   └── ...
├── scripts/                    # Utility scripts (Future)
│   └── ...
├── src/                        # Source code
│   ├── App.tsx                 # Main application component. Initializes hooks (useGameStateManager, useTimer), renders Layout components within ThemeProvider. Manages virtual keyboard input handling and focus. Passes state down.
│   ├── main.tsx                # Application entry point
│   │
│   ├── Crossword/              # Crossword Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── CrosswordCore/  # Reused components <-- Uses styled-components internally
│   │   │   │   ├── CrosswordProvider.tsx # {UI component} <-- Status: Controlled. Receives state via props/context. Forwards interactions.
│   │   │   │   ├── CrosswordGrid.tsx     # {Renders SVG grid} <-- Updated to use ref callback pattern for input element.
│   │   │   │   ├── Cell.tsx              # {Renders SVG cells} <-- Applies stage colors.
│   │   │   │   └── context.ts / util.ts
│   │   │   ├── ThemedCrossword.tsx # {Adapter/Wrapper} <-- Connects GameState <=> Provider. Applies CrosswordWrapper style. Focus logic refactored.
│   │   │   └── ClueVisualiser.tsx  # {Clue display} <-- Status: Styled. Uses theme vars. Text-align left.
│   │   ├── types/              # Types specific to Crossword feature
│   │   │   └── index.ts          # {Includes InputRefCallback type for input element reference}
│   │   └── styles/             # Styles specific to Crossword feature
│   │       ├── CrosswordStyles.ts # {Contains crosswordTheme object. Defines CrosswordWrapper styled-component (aspect-ratio, etc.)}
│   │       └── index.ts
│   │
│   ├── Keyboard/               # Keyboard Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   └── VirtualKeyboard.tsx # {Renders react-simple-keyboard with custom layout} <-- Status: Implemented. Renders QWERTY layout with Enter and Backspace keys.
│   │   └── styles/             # Styles specific to Keyboard feature
│   │       └── KeyboardStyles.ts  # {Defines global styles for keyboard theme} <-- Status: Implemented. Uses theme variables with responsive styling.
│   │
│   ├── Timer/                  # Timer Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── TimerDisplay.tsx  # {Displays MM:SS time} <-- Status: Styled. Responsive font, monospace, stable width, dynamic TEXT color based on stage. No background.
│   │   │   ├── StageProgressBar.tsx # {Displays stage progress} <-- Status: Implemented & Styled. Pill shape, flex-grow, correct drain, dynamic FILL color.
│   │   │   └── TimerUnit.tsx     # {Wrapper Component} <-- Status: Added. Renders TimerDisplay & StageProgressBar within TimerBarContainer layout. Receives props from App.tsx.
│   │   ├── hooks/              # Hooks specific to this feature
│   │   │   └── useTimer.ts       # {Tracks time, calculates stage & ratio} <-- Status: Implemented. Returns elapsedTime, currentStage, stageTimeRemainingRatio. Uses precise time internally.
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── GameFlow/               # Game Flow / State Feature
│   │   ├── components/         # UI specific to this feature (Modals - Future)
│   │   ├── state/              # State management for this feature
│   │   │   └── useGameStateManager.ts # {Central coordinator hook} <-- Status: Owns core game state. Returns puzzleData, gridData, completedWords, isGameComplete, handleGuessInput, handleBackspace etc.
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── Puzzle/                 # Puzzle Data/Loading Feature
│   │   ├── data/
│   │   │   ├── PuzzleRepository.ts # {Handles fetching} <-- Action Item: Implement fetch (Future).
│   │   │   └── themedPuzzles.ts    # {Hardcoded Source for now}
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── Layout/                 # Application Layout Feature
│   │   └── components.ts       # {Defines **CSS Grid layout** styled-components: AppWrapper (grid, svh/dvh, safe-area), Banner, TimerBarContainer (flex row within grid row), CrosswordArea, ClueArea, KeyboardArea. Defines grid rows & sizing.} <-- Status: Optimized KeyboardArea with minimal padding.
│   │
│   ├── Sharing/                # Share Feature (Future Phase)
│   │   ├── components/         # {ShareButton.tsx - Future}
│   │   ├── utils/              # {canvasRenderer.ts - Future}
│   │   └── types.ts            # {Future}
│   │
│   ├── Integration/            # External Integrations Feature
│   │   └── Firebase/           # {Future}
│   │
│   ├── lib/                    # Shared utilities
│   │   └── utils.ts
│   ├── hooks/                  # Shared custom hooks (None currently)
│   ├── styles/                 # Global styles (App level)
│   │   └── index.css           # {Minimal global styles, resets, safe-area CSS vars} <-- Status: Updated with resets & safe-area vars.
│   ├── types/                  # Shared global types (None currently)
│   ├── assets/                 # Shared assets
│   └── styled.d.ts             # TypeScript declaration for styled-components theme <-- Status: Updated. Defines full AppTheme including keyboard-related variables.
├── dist/                       # Build output
├── index.html                  # Main HTML file
├── tsconfig.json               # Config file
├── vite.config.ts              # Build file
├── package.json                # Project metadata/dependencies
└── .gitignore                  # Exclusion rules