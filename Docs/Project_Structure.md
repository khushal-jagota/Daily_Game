# Project Structure: Themed Crossword Game (Updated Post-Prototype Phase 3)

## Executive Summary

This document outlines the approved project structure for the new themed crossword game, organized according to standard practices and emphasizing feature-based modularity within the `/src` directory. The structure includes a dedicated **`Layout` module** for managing application structure and appearance. It is designed to **maximize reuse** of core crossword UI logic (`CrosswordCore`), integrated via an adapter (`ThemedCrossword`) connected to a central **`useGameStateManager` custom hook**. This hook manages **all dynamic game state** (focus, selection, guesses, completion status - tracked via a Map for future staging) and contains **all core interaction logic**, including input validation, movement, and correctness checking (leveraging internal effects/helpers for reliable state synchronization). The structure supports **dynamic loading of daily puzzles** and integrates features like timing and external services (e.g., Firebase). Shared utilities are placed in `/src/lib/`. **Styling Approach:** **`styled-components` will be used consistently** across the application, with theme definitions centralized in `/src/Crossword/styles/`.

**Key Considerations & Action Items:**
*   **Feature Modularity:** Ensure new components, logic, and types are placed within the appropriate feature directory (`Layout`, `Crossword`, `GameFlow`, `Puzzle`, `Timer`, etc.).
*   **Layout Management:** Use components defined in `/src/Layout/` to structure the application view. Implement responsive layout.
*   **Styling Consistency:** All new components (`ClueVisualiser`, Modals, `TimerDisplay`, `Layout` components) should be implemented using `styled-components`. Ensure the shared theme (defined in `Crossword/styles`) is applied globally via `ThemeProvider` and contains necessary visual constants (like completion colors). Update theme type definitions (`styled.d.ts`) accordingly.
*   **`CrosswordCore` Reuse:** The reused `CrosswordProvider.tsx` is a controlled component, receiving `gridData`, selection/completion status (derived from the hook state) via props/context, and forwarding interaction events (`onGuessAttempt`, etc.) via callbacks. It is stateless regarding guesses and validation.
*   **Adapter Pattern (`ThemedCrossword`):** This component is crucial for connecting the hook to the provider, passing state down (including `gridData`, calculated visual states like `cellCompletionStatus` map), wiring callbacks up, and managing imperative focus.
*   **Data Fetching:** Implement fetching logic in `/src/Puzzle/data/PuzzleRepository.ts`.
*   **`useGameStateManager` Focus:** `/src/GameFlow/state/useGameStateManager.ts` is the definitive central state orchestrator, owning `gridData` (guesses), focus/selection state, and `completedWords` state (as `Map<string, { stage: number }>`). It manages all interaction logic (moves, input, validation, completion checks), utilizing internal effects and helpers for reliability. Action Item: Integrate Timer, Scoring logic.
*   **Downward State Flow / Upward Actions:** `useGameStateManager` returns state/actions. `App.tsx` consumes these, passes them via the `Layout` structure to `ThemedCrossword`, which then derives/passes necessary props to `CrosswordProvider` and connects provider callbacks back to hook actions.
*   **Firebase Integration:** Implement Firebase SDK setup in `/src/Integration/Firebase/config.ts`.
*   **Shared Utilities:** Place generic, reusable functions (like `getCellKey`) in `/src/lib/utils.ts`.

**Overall:** This feature-driven structure, with its clear separation of concerns enabled by the central hook and adapter pattern, provides a solid foundation for a maintainable, scalable, and feature-rich application, maximizing reuse while ensuring consistent styling and robust state management.

---

## Project Directory Structure

```plaintext
new-themed-crossword/
├── functions/                  # Firebase Cloud Functions
├── node_modules/               # Dependencies (excluded via .gitignore)
├── public/                     # Static assets
│   └── ...
├── scripts/                    # Utility scripts
│   └── ...
├── src/                        # Source code
│   ├── App.tsx                 # Main application component (Calls hook, integrates Layout and Features)
│   ├── main.tsx                # Application entry point
│   │
│   ├── Crossword/              # Crossword Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── CrosswordCore/  # Reused components <-- Uses styled-components.
│   │   │   │   ├── CrosswordProvider.tsx # {UI component} <-- Status: Controlled. Receives `gridData`/selection/completion state via props/context. Forwards interaction events (`onGuessAttempt`, etc.) via callbacks. Stateless re: guesses/validation.
│   │   │   │   ├── CrosswordGrid.tsx     # {Renders SVG grid & input handler} <-- Status: Consumes context for state/data. Renders Cells using `getCellKey`. Passes status prop to Cell.
│   │   │   │   ├── Cell.tsx              # {Renders SVG cells} <-- Status: Displays guess/focus/highlight/completion state via props. Reads theme for colors. Applies precedence logic.
│   │   │   │   ├── context.ts            # {Internal React context} <-- Status: Provides centrally-managed state/data received via Provider props, including completion status.
│   │   │   │   └── util.ts               # {Utility functions specific to CrosswordCore - Reusable}
│   │   │   ├── ThemedCrossword.tsx # {Adapter/Wrapper} <-- Status: Connects hook <=> Provider. Passes `gridData`/state props. Calculates/passes derived state (e.g. `cellCompletionStatus` map). Wires callbacks to actions. Manages focus. Styled.
│   │   │   └── ClueVisualiser.tsx  # {New Clue display} <-- Status: Displays active clue from hook state. Handles click via hook action. Styled.
│   │   ├── types/              # Types specific to Crossword feature
│   │   │   └── index.ts        # {Contains core types like CluesInput, CrosswordTheme - Reusable}
│   │   └── styles/             # Styles specific to Crossword feature
│   │       ├── CrosswordStyles.ts # {Contains canonical crosswordTheme object (incl. completion colors), other styles} <-- Action Item: Add theme properties for different completion stages/colors later.
│   │       └── index.ts
│   │
│   ├── Timer/                  # Timer Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   └── TimerDisplay.tsx  # {Reads timer state (likely from hook)} <-- Action Item: Build. Styled with styled-components.
│   │   ├── module/             # Logic module for this feature
│   │   │   └── ...               # Action Item: Implement timer logic (potentially as separate hook or integrated into main hook).
│   │   └── types/              # Types specific to Timer feature
│   │       └── index.ts
│   │
│   ├── GameFlow/             # Game Flow / State Feature
│   │   ├── components/         # UI specific to this feature (Modals)
│   │   │   └── ...               # {Modals, etc.} <-- Action Item: Build as needed. Styled. Interact with hook state/actions.
│   │   ├── state/              # State management for this feature
│   │   │   └── useGameStateManager.ts # {Central coordinator hook} <-- Status: Owns `gridData`, focus/selection state, `completedWords` (Map<string, { stage: number }> tracking completion stage). Contains ALL interaction logic/validation/completion checks (using internal effects/helpers for reliability). Action Item: Integrate Timer, Scoring logic.
│   │   └── types/              # Types specific to GameFlow/State
│   │       └── index.ts
│   │
│   ├── Puzzle/                 # Puzzle Data/Loading Feature
│   │   ├── data/               # Data fetching/definition logic
│   │   │   └── PuzzleRepository.ts # {Handles fetching from backend} <-- Action Item: Implement fetch logic.
│   │   └── types/              # Types specific to Puzzle data structure
│   │       └── index.ts
│   │
│   ├── Layout/                 # Application Layout Feature
│   │   └── components.ts       # {Defines styled-components for app structure} <-- Action Item: Implement responsive layout refinements.
│   │
│   ├── Integration/            # External Integrations Feature
│   │   └── Firebase/           # Firebase integration specifics
│   │       └── config.ts       # {Firebase SDK Initialization & export} <-- Action Item: Implement Firebase setup.
│   │
│   ├── lib/                    # Shared utilities/libraries across features
│   │   └── utils.ts            # {General utils - Contains `getCellKey`} <-- Status: Exists, contains generic utilities.
│   ├── hooks/                  # Shared custom hooks (App level)
│   │   └── ...
│   ├── styles/                 # Global styles (App level)
│   │   └── index.css           # {Minimal global styles, or setup for styled-components GlobalStyle}
│   ├── types/                  # Shared global types (App level)
│   │   └── index.ts
│   ├── assets/                 # Shared assets (App level)
│   │   └── ...
│   └── styled.d.ts             # TypeScript declaration for styled-components theme <-- Action Item: Update with new theme properties as needed (e.g., stage colors).
├── dist/                       # Build output (excluded via .gitignore)
├── index.html                  # Main HTML file
├── tsconfig.json               # Config file
├── vite.config.ts              # Build file
├── package.json                # Project metadata/dependencies
└── .gitignore                  # Exclusion rules