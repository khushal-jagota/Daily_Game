# Project Structure: Themed Crossword Game (Updated Post-Phase 5)

## Executive Summary

This document outlines the project structure for the themed crossword game, emphasizing feature-based modularity. The core architecture centers around a central **`useGameStateManager` custom hook** (`src/GameFlow/state/`), which manages all dynamic game state. UI rendering leverages reused **`CrosswordCore`** components controlled via the **`ThemedCrossword`** adapter (`src/Crossword/components/`).

A significant change implemented in Phase 4.75 is the adoption of **CSS Grid for the main application layout**. The root **`AppWrapper`** component (`src/Layout/components.ts`) now uses `display: grid` and `grid-template-rows` to explicitly define vertical sections for the banner, timer/bar, crossword area, clue area, and keyboard area. This ensures a robust **single-view layout** confined to the viewport height using modern units (`min-height: 100svh` with `100dvh` fallback) and handling **safe area insets** via CSS variables. Row sizing uses `auto`, `1fr`, `max-content`, and `minmax(clamp(...), auto)` for responsive and predictable space allocation. **`App.tsx`** remains the orchestrator, initializing hooks and rendering the main components within this Grid structure.

Phase 5 introduces the **virtual keyboard** feature using the `react-simple-keyboard` library. The keyboard implementation follows a responsive design approach with optimized spacing and styling that integrates seamlessly with the application's dark theme. A new **focus management system** has been implemented using a direct reference to the hidden input element in the crossword grid, improving interaction between virtual and physical keyboards, though a minor known issue remains with the virtual-to-physical transition.

Styling relies on **`styled-components`**, with theme values defined (`src/Crossword/styles/CrosswordStyles.ts`, `src/styled.d.ts`). The Timer/Bar unit, Clue display, and Keyboard have been styled for a clean, responsive look using theme variables (including dark theme additions) and relative units (`rem`, `clamp`, `ch`). Manual testing remains the primary validation strategy, now including checks across various viewports and real devices for keyboard interactions and layout stability.

**Key Considerations & Current State (Post-Phase 5):**
*   **Layout Engine:** CSS Grid (`grid-template-rows`) in `AppWrapper`.
*   **Viewport Handling:** Uses `min-height: 100svh/dvh` and `env(safe-area-inset-*)`. Application layout confirmed stable and non-scrolling.
*   **Row Sizing:** Uses `auto`, `1fr`, `max-content`, `minmax(clamp(...), auto)`.
*   **Component Styling:** Timer, Progress Bar, Clue display, and Keyboard styled using theme variables (dark theme applied) and responsive units.
*   **Crossword Fitting:** `CrosswordWrapper` maintains `1:1` aspect ratio and scales correctly within the `1fr` `CrosswordArea` grid track.
*   **Virtual Keyboard:** Implemented (`react-simple-keyboard`), styled (dark theme), layout optimized. Includes Letters, Backspace, Enter (non-functional).
*   **Focus Management:** Refactored to use a direct reference (via callback ref) to the hidden input element managed in `App.tsx`. Enables **improved interaction** between virtual keyboard input and physical keyboard input (with one documented edge case).
*   **State Management:** Centered on `useGameStateManager`. Keyboard input connected (`handleGuessInput`, refined `handleBackspace`).
*   **Core Components:** `CrosswordGrid` renders cells directly (post-refactor); uses ref callback pattern. `ThemedCrossword` passes ref callback, removed old focus calls. `CrosswordProvider` provides context.
*   **Testing:** Manual testing scope expanded for keyboard interaction, focus, layout scaling, and refined Backspace logic. Known issue documented.

**Overall:** The application now provides a complete touch-friendly interface with the virtual keyboard implementation, making it fully usable on mobile and tablet devices. Critical layout, scaling, and rendering issues have been resolved, and a dark theme has been implemented.

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
│   ├── App.tsx                 # Main application component. Initializes hooks. Manages virtual keyboard input handling & focus (via callback ref state). Renders Layout components.
│   ├── main.tsx                # Application entry point
│   │
│   ├── Crossword/              # Crossword Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── CrosswordCore/  # Reused components <-- Uses styled-components internally
│   │   │   │   ├── CrosswordProvider.tsx # {UI component} <-- Status: Controlled. Provides context. Forwards interactions via props.
│   │   │   │   ├── CrosswordGrid.tsx     # {Renders SVG grid directly using CSS/SVG coordinates.} <-- Refactored. Uses ref callback.
│   │   │   │   └── context.ts / util.ts
│   │   │   ├── ThemedCrossword.tsx # {Adapter/Wrapper} <-- Connects GameState <=> Provider. Removed imperative focus calls. Passes ref callback. Applies CrosswordWrapper style.
│   │   │   └── ClueVisualiser.tsx  # {Clue display} <-- Status: Styled. Uses theme vars. Text-align left.
│   │   ├── types/              # Types specific to Crossword feature
│   │   │   └── index.ts          # {Includes InputRefCallback type for input element reference}
│   │   └── styles/             # Styles specific to Crossword feature
│   │       ├── CrosswordStyles.ts # {Contains crosswordTheme object (dark theme styles added). Defines CrosswordWrapper...}
│   │       └── index.ts
│   │
│   ├── Keyboard/               # Keyboard Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   └── VirtualKeyboard.tsx # {Renders react-simple-keyboard with custom layout} <-- Status: Implemented. Renders QWERTY + Enter/Backspace. Injects global styles.
│   │   └── styles/             # Styles specific to Keyboard feature
│   │       └── KeyboardStyles.ts  # {Defines global styles for keyboard theme} <-- Status: Implemented. Uses theme vars (dark theme) with responsive styling.
│   │
│   ├── Timer/                  # Timer Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── TimerDisplay.tsx  # {Displays MM:SS time} <-- Status: Styled.
│   │   │   ├── StageProgressBar.tsx # {Displays stage progress} <-- Status: Implemented & Styled.
│   │   │   └── TimerUnit.tsx     # {Wrapper Component} <-- Status: Added.
│   │   ├── hooks/              # Hooks specific to this feature
│   │   │   └── useTimer.ts       # {Tracks time, calculates stage & ratio} <-- Status: Implemented.
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── GameFlow/               # Game Flow / State Feature
│   │   ├── components/         # UI specific to this feature (Modals - Future)
│   │   ├── state/              # State management for this feature
│   │   │   └── useGameStateManager.ts # {Central coordinator hook} <-- Status: Owns core game state. Backspace logic refined.
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
│   │   └── components.ts       # {Defines **CSS Grid layout** styled-components: AppWrapper (grid, svh/dvh, safe-area), ..., KeyboardArea. Defines grid rows & sizing.} <-- Status: Optimized KeyboardArea padding. CrosswordArea uses flex centering.
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
│   │   └── index.css           # {Minimal global styles, resets, safe-area CSS vars} <-- Status: Updated.
│   ├── types/                  # Shared global types (None currently)
│   ├── assets/                 # Shared assets
│   └── styled.d.ts             # TypeScript declaration for styled-components theme <-- Status: Updated. Defines full AppTheme including keyboard/dark theme variables.
├── dist/                       # Build output
├── index.html                  # Main HTML file
├── tsconfig.json               # Config file
├── vite.config.ts              # Build file
├── package.json                # Project metadata/dependencies
└── .gitignore                  # Exclusion rules