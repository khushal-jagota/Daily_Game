# Project Structure: Themed Crossword Game (Simplified Prototype)

## Prototype Focus

This **simplified prototype** focuses *exclusively* on testing the **core crossword interaction and completion logic**:
*   Displaying and interacting with the crossword (`CrosswordCore`).
*   Displaying the active clue for usability (`ClueVisualiser`).
*   Managing state (`GameStateManager`) to track **word completion** and **block input** on completed words.
*   Applying a **predetermined, fixed color** to completed words upon completion.
*   Handling puzzle completion status (`GameStateManager`).
*   Synchronizing grid focus/selection with clue display via `GameStateManager`.

**Styling Approach:** **`styled-components` will be used consistently** for both the reused `CrosswordCore` and all new prototype components (`ClueVisualiser`, `TimerDisplay` if added later) to ensure consistency during this phase.

This prototype uses **hardcoded data** (`data/themedPuzzles.ts`) and maintains the feature-based directory structure for easy expansion later.

---

## Project Directory Structure (Simplified Prototype)

```plaintext
prototype-themed-crossword/
├── public/                     # Static assets
├── src/                        # Source code
│   ├── App.tsx                 # Main application component (App level)
│   ├── main.tsx                # Application entry point (App level)
│   │
│   ├── Crossword/              # Crossword Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── CrosswordCore/  # Reused components <-- Contains code from old project. Uses styled-components.
│   │   │   │   ├── CrosswordProvider.tsx # {Manages internal grid state/interaction} <-- **Action Item:** Modify for: 1) Input Blocking (via `completedWordIds` prop), 2) Basic Keyboard Input, 3) Disable Storage.
│   │   │   │   ├── CrosswordGrid.tsx     # {Renders SVG grid & input handler}
│   │   │   │   ├── Cell.tsx              # {Renders SVG cells} <-- **Action Item:** Ensure it can display the fixed completion color (likely via existing theme/context/props from Provider).
│   │   │   │   ├── context.ts            # {Internal React context}
│   │   │   │   └── util.ts               # {Utility functions - Reusable}
│   │   │   ├── ThemedCrossword.tsx # {Adapter/Wrapper} <-- **Action Item:** Implement to connect GSM state/actions with CrosswordProvider props/callbacks (incl. passing `completedWordIds` and completion color info). Styled with styled-components.
│   │   │   └── ClueVisualiser.tsx  # {Basic Clue display} <-- **Action Item:** Build to display active clue text from GSM. Implement click handler to call GSM's `handleClueSelect`. Styled with styled-components.
│   │   ├── types/              # Types specific to Crossword feature
│   │   │   └── index.ts        # {Contains core types like CluesInput - Reusable} <-- Renamed from types.ts for cleaner imports
│   │   └── styles/             # Styles specific to Crossword feature
│   │       ├── CrosswordStyles.ts # {Primary styles for CrosswordCore using styled-components} <-- Moved from CrosswordCore directory
│   │       └── index.ts        # {Exports from CrosswordStyles for easier imports}
│   │
│   ├── GameFlow/             # Game Flow / State Feature
│   │   ├── state/              # State management for this feature
│   │   │   └── GameStateManager.ts # {Central coordinator} <-- **Action Item:** Implement state (puzzle, completedWords, focus/selection). Implement interaction logic (handleCellSelect, handleClueSelect). **Modify `completeWord` to use a fixed color.** Remove Timer integration.
│   │   └── types/              # Types specific to GameFlow/State
│   │       └── index.ts
│   │
│   ├── Puzzle/                 # Puzzle Data/Loading Feature
│   │   ├── data/               # Data fetching/definition logic
│   │   │   └── themedPuzzles.ts    # {**Hardcoded Source for Prototype**: Defines puzzle structure (CluesInput format) & theme info.}
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
│   └── assets/                 # Shared assets (App level)
│       └── ...
├── dist/                       # Build output (excluded via .gitignore)
├── index.html                  # Main HTML file
├── tsconfig.json               # Config file
├── vite.config.ts              # Build file
├── package.json                # Project metadata/dependencies
└── .gitignore                  # Exclusion rules