# Project Structure: Themed Crossword Game (Updated Post-Phase 6)

## Executive Summary

This document outlines the project structure for the themed crossword game, emphasizing feature-based modularity. The core architecture centers around a central **`useGameStateManager` custom hook** (`src/GameFlow/state/`), managing dynamic game state. UI rendering leverages reused **`CrosswordCore`** components controlled via **`ThemedCrossword`** (`src/Crossword/components/`). Styling uses **`styled-components`**. The main layout uses **CSS Grid** (`src/Layout/components.ts`).

Phase 5 introduced the **virtual keyboard** (`src/Keyboard/`) and refined focus management.

**Phase 6 implemented the 'Share Result' feature.** Upon game completion, a **modal (`src/Sharing/components/ResultModal.tsx`)** automatically appears. Inside the modal, a **client-side Canvas renderer (`src/Sharing/utils/canvasRenderer.ts`)** generates a PNG image preview of the result (Layout v4: colored time top-right, centered info line, colored grid below using 'Latest Stage' priority, no letters). The modal provides functional **"Share"** (using `navigator.share` with file/text fallback) and **"Copy Image"** (using `navigator.clipboard.write`) buttons. Modal visibility is triggered in **`App.tsx`** based on game completion state transition, passing memoized data. Image generation is handled within the modal's `useEffect`, including Object URL management for preview and cleanup.

**Key Considerations & Current State (Post-Phase 6):**
*   **Layout Engine:** CSS Grid (`grid-template-rows`) in `AppWrapper`. Stable.
*   **Core State:** Managed by `useGameStateManager`.
*   **Input:** Virtual Keyboard functional; Focus management stable.
*   **Sharing Feature (NEW):**
    *   Modal (`ResultModal.tsx`) auto-opens on game completion.
    *   Client-side PNG generation via Canvas API (`canvasRenderer.ts`) implemented (Layout v4).
    *   Cell coloring uses "Latest Stage" priority.
    *   Image preview displayed in modal using Blob/Object URL.
    *   "Share" button implemented using `navigator.share`.
    *   "Copy Image" button implemented using `navigator.clipboard.write`.
    *   Modal visibility controlled in `App.tsx` (transition logic).
*   **`CrosswordCore` Risk:** Remains unchanged - external origins, limited internal documentation, **zero automated tests**. Component stability relies on manual testing and careful modification.
*   **Testing Strategy:** Remains **Manual Testing Only**. No automated tests (unit, integration, E2E) exist. Error monitoring is **not implemented**. This constitutes significant, ongoing technical debt and risk.
*   **Styling:** Core components styled; dark theme applied. PNG styling is basic; further refinement may be needed.

**Overall:** The application now provides core gameplay, virtual keyboard input, and a mechanism for users to view, share, or copy a visual summary of their completed game result. Foundational risks related to testing and the core crossword component persist.

---

## Project Directory Structure (Post-Phase 6)

```plaintext
new-themed-crossword/
├── functions/                  # Firebase Cloud Functions (Future)
├── node_modules/               # Dependencies (excluded via .gitignore)
├── public/                     # Static assets
│   └── ...
├── scripts/                    # Utility scripts (Future)
│   └── ...
├── src/                        # Source code
│   ├── App.tsx                 # Main component. Initializes hooks. Manages modal visibility trigger. Passes memoized data to modal. Renders Layout.
│   ├── main.tsx                # Application entry point
│   │
│   ├── Crossword/              # Crossword Feature (Core Grid UI/Logic)
│   │   ├── components/
│   │   │   ├── CrosswordCore/  # Reused components (No automated tests)
│   │   │   │   ├── CrosswordProvider.tsx
│   │   │   │   ├── CrosswordGrid.tsx
│   │   │   │   └── context.ts / util.ts
│   │   │   ├── ThemedCrossword.tsx # Adapter
│   │   │   └── ClueVisualiser.tsx  # Clue display
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       ├── CrosswordStyles.ts # Contains crosswordTheme
│   │       └── index.ts
│   │
│   ├── Keyboard/               # Keyboard Feature (Phase 5)
│   │   ├── components/
│   │   │   └── VirtualKeyboard.tsx # Implemented
│   │   └── styles/
│   │       └── KeyboardStyles.ts  # Implemented
│   │
│   ├── Timer/                  # Timer Feature
│   │   ├── components/         # TimerDisplay, StageProgressBar, TimerUnit
│   │   ├── hooks/
│   │   │   └── useTimer.ts       # Tracks time, calculates stage
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── GameFlow/               # Game Flow / State Feature
│   │   ├── components/         # (Future Modals?)
│   │   ├── state/
│   │   │   └── useGameStateManager.ts # Central coordinator hook
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── Puzzle/                 # Puzzle Data/Loading Feature
│   │   ├── data/
│   │   │   ├── PuzzleRepository.ts # (Future)
│   │   │   └── themedPuzzles.ts    # Hardcoded Source
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── Layout/                 # Application Layout Feature
│   │   └── components.ts       # CSS Grid layout components (AppWrapper, etc.)
│   │
│   ├── Sharing/                # Share Feature (Phase 6 - NEW)
│   │   ├── components/
│   │   │   └── ResultModal.tsx     # {Displays preview, Share/Copy buttons} <-- Implemented
│   │   ├── utils/
│   │   │   └── canvasRenderer.ts # {Generates result PNG via Canvas} <-- Implemented
│   │   └── types.ts            # {CanvasData interface} <-- Implemented
│   │
│   ├── Integration/            # External Integrations Feature
│   │   └── Firebase/           # (Future)
│   │
│   ├── lib/                    # Shared utilities
│   │   └── utils.ts
│   ├── hooks/                  # Shared custom hooks (None currently)
│   ├── styles/                 # Global styles (App level)
│   │   └── index.css
│   ├── types/                  # Shared global types (None currently)
│   ├── assets/                 # Shared assets
│   └── styled.d.ts             # TypeScript declaration for styled-components theme
├── dist/                       # Build output
├── index.html                  # Main HTML file
├── tsconfig.json               # Config file
├── vite.config.ts              # Build file
├── package.json                # Project metadata/dependencies
└── .gitignore                  # Exclusion rules