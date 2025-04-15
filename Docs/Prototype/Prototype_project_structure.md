# Project Structure: Themed Crossword Game (Simplified Prototype) - Post Phase 2.5

## Prototype Focus

This **simplified prototype** focuses *exclusively* on testing the **core crossword interaction and completion logic** within a **basic visual layout**:
*   Arranging main UI areas (`Layout`).
*   Displaying and interacting with the crossword (`CrosswordCore`).
*   Displaying the active clue for usability (`ClueVisualiser`).
*   Managing state centrally using the **`useGameStateManager` custom hook** to track **word completion** (Phase 3), **grid focus/selection**, AND **player guesses (`gridData`)**. Input blocking validation logic resides within the hook.
*   Applying a **predetermined, fixed color** to completed words upon completion (Phase 3).
*   Synchronizing grid focus/selection with clue display via `useGameStateManager`.

**Styling Approach:** **`styled-components` will be used consistently** for the reused `CrosswordCore`, new prototype components (`ClueVisualiser`), and the basic layout scaffolding (`Layout`) to ensure consistency.

This prototype uses **hardcoded data** (`data/themedPuzzles.ts`) and maintains the feature-based directory structure.

---

## Project Directory Structure (Simplified Prototype) - Post Phase 2.5

```plaintext
prototype-themed-crossword/
├── public/                     # Static assets
├── src/                        # Source code
│   ├── App.tsx                 # Main application component (Calls hook, integrates Layout/Features)
│   ├── main.tsx                # Application entry point
│   │
│   ├── Crossword/              # Crossword Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── CrosswordCore/  # Reused components <-- Contains code from old project. Uses styled-components.
│   │   │   │   ├── CrosswordProvider.tsx # {UI component} <-- Status: Controlled component. Receives `gridData` & focus state via props. Forwards interaction events (`onCellSelect`, `onMoveRequest`, `onGuessAttempt`, etc.) via callbacks. Stateless regarding guesses and validation.
│   │   │   │   ├── CrosswordGrid.tsx     # {Renders SVG grid & input handler} <-- Status: Consumes context for selection state & `gridData` (guesses). Calculates & passes display props (`focus`, `highlight`, guess text, completion color) to Cell.
│   │   │   │   ├── Cell.tsx              # {Renders SVG cells} <-- Status: Displays state (`focus`, `highlight`, guess, number). Action Item: Display completion color/state via prop (Phase 3).
│   │   │   │   ├── context.ts            # {Internal React context} <-- Status: Provides centrally-managed `gridData` and focus/selection state received from Provider props.
│   │   │   │   └── util.ts               # {Utility functions - Reusable}
│   │   │   ├── ThemedCrossword.tsx # {Adapter/Wrapper} <-- Status: Connects `useGameStateManager` state/actions <=> `CrosswordProvider` props/callbacks. Passes `gridData` down. Wires `onGuessAttempt`, `onBackspaceRequest`, etc. Handles imperative focus. Passes `completedWordIds` to hook actions.
│   │   │   └── ClueVisualiser.tsx  # {Basic Clue display} <-- Status: Complete (Phase 2). Displays active clue from hook state. Handles click via hook action.
│   │   ├── types/              # Types specific to Crossword feature
│   │   │   └── index.ts        # {Contains core types like CluesInput, CrosswordTheme - Reusable}
│   │   └── styles/             # Styles specific to Crossword feature
│   │       ├── CrosswordStyles.ts # {Contains canonical crosswordTheme object, other styles}
│   │       └── index.ts        # {Exports from CrosswordStyles}
│   │
│   ├── GameFlow/             # Game Flow / State Feature
│   │   ├── state/              # State management for this feature
│   │   │   └── useGameStateManager.ts # {Central coordinator hook} <-- Status: Owns `gridData` (guesses) & focus/selection state. Contains all interaction logic (movement, selection, guess input, delete, validation via `isEditableCell`). Manages state updates. Action Item: Implement `completedWords` state & correctness checking (Phase 3).
│   │   └── types/              # Types specific to GameFlow/State (e.g., state shape returned by hook)
│   │       └── index.ts
│   │
│   ├── Layout/                 # NEW: Basic Application Layout Feature (Prototype Scaffolding)
│   │   └── components.ts       # {Defines basic styled-components for layout} <-- Status: Basic structure implemented (Phase 1.75). Complete.
│   │
│   ├── Puzzle/                 # Puzzle Data/Loading Feature
│   │   ├── data/               # Data fetching/definition logic
│   │   │   └── themedPuzzles.ts    # {**Hardcoded Source for Prototype**: Defines puzzle structure}
│   │   └── types/              # Types specific to Puzzle data structure (if needed)
│   │       └── index.ts
│   │
│   ├── lib/                    # Shared utilities/libraries across features
│   │   └── utils.ts            # {General utils - Reusable}
│   ├── hooks/                  # Shared custom hooks (App level)
│   │   └── ...
│   ├── styles/                 # Global styles (App level)
│   │   └── index.css           # {Minimal global styles, or setup for styled-components GlobalStyle}
│   ├── types/                  # Shared global types (App level)
│   │   └── index.ts
│   ├── assets/                 # Shared assets (App level)
│   │   └── ...
│   └── styled.d.ts             # TypeScript declaration for styled-components theme
├── dist/                       # Build output (excluded via .gitignore)
├── index.html                  # Main HTML file
├── tsconfig.json               # Config file
├── vite.config.ts              # Build file
├── package.json                # Project metadata/dependencies
└── .gitignore                  # Exclusion rules