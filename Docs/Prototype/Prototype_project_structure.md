# Project Structure: Themed Crossword Game (Simplified Prototype)

## Prototype Focus

This **simplified prototype** focuses *exclusively* on testing the **core crossword interaction and completion logic** within a **basic visual layout**:
*   Arranging main UI areas (`Layout`).
*   Displaying and interacting with the crossword (`CrosswordCore`).
*   Displaying the active clue for usability (`ClueVisualiser`).
*   Managing state centrally using the **`useGameStateManager` custom hook** to track **word completion**, **grid focus/selection**, and **block input** on completed words.
*   Applying a **predetermined, fixed color** to completed words upon completion.
*   Synchronizing grid focus/selection with clue display via `useGameStateManager`.

**Styling Approach:** **`styled-components` will be used consistently** for the reused `CrosswordCore`, new prototype components (`ClueVisualiser`), and the basic layout scaffolding (`Layout`) to ensure consistency.

This prototype uses **hardcoded data** (`data/themedPuzzles.ts`) and maintains the feature-based directory structure.

---

## Project Directory Structure (Simplified Prototype)

```plaintext
prototype-themed-crossword/
├── public/                     # Static assets
├── src/                        # Source code
│   ├── App.tsx                 # Main application component (Calls useGameStateManager, integrates Layout and Features)
│   ├── main.tsx                # Application entry point
│   │
│   ├── Crossword/              # Crossword Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── CrosswordCore/  # Reused components <-- Contains code from old project. Uses styled-components.
│   │   │   │   ├── CrosswordProvider.tsx # {Manages internal grid state/interaction} <-- **Action Item:** Modify for: 1) Input Blocking, 2) Accepting external callbacks/state (selection, completion), 3) Disable Storage.
│   │   │   │   ├── CrosswordGrid.tsx     # {Renders SVG grid & input handler} <-- **Action Item:** Consume context, pass props to Cell.
│   │   │   │   ├── Cell.tsx              # {Renders SVG cells} <-- **Action Item:** Display completion color/state via prop.
│   │   │   │   ├── context.ts            # {Internal React context} <-- **Action Item:** Modify context value.
│   │   │   │   └── util.ts               # {Utility functions - Reusable}
│   │   │   ├── ThemedCrossword.tsx # {Adapter/Wrapper} <-- **Action Item:** Connect useGameStateManager state/actions <=> Provider props/callbacks. Styled with styled-components. Renders CrosswordProvider/Grid.
│   │   │   └── ClueVisualiser.tsx  # {Basic Clue display} <-- **Action Item:** Build to display active clue text. Implement click handler. Styled with styled-components.
│   │   ├── types/              # Types specific to Crossword feature
│   │   │   └── index.ts        # {Contains core types like CluesInput, CrosswordTheme - Reusable}
│   │   └── styles/             # Styles specific to Crossword feature
│   │       ├── CrosswordStyles.ts # {Contains canonical crosswordTheme object, other styles}
│   │       └── index.ts        # {Exports from CrosswordStyles}
│   │
│   ├── GameFlow/             # Game Flow / State Feature
│   │   ├── state/              # State management for this feature
│   │   │   └── useGameStateManager.ts # {Central coordinator hook} <-- **Action Item:** Implement state (puzzle, completedWords, focus/selection) using useState. Implement action functions (handleCellSelect, handleClueSelect, completeWord).
│   │   └── types/              # Types specific to GameFlow/State (e.g., state shape returned by hook)
│   │       └── index.ts
│   │
│   ├── Layout/                 # NEW: Basic Application Layout Feature (Prototype Scaffolding)
│   │   └── components.ts       # {Defines basic styled-components for layout: AppWrapper, Banner, CrosswordArea, ClueArea, KeyboardArea} <-- **Action Item:** Implement basic structure.
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