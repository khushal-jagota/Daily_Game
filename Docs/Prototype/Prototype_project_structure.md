# Project Structure: Themed Crossword Game (Simplified Prototype)

## Prototype Focus

This **simplified prototype** focuses *exclusively* on testing the **core crossword interaction and completion logic**:
*   Displaying and interacting with the crossword (`CrosswordCore`).
*   Displaying the active clue for usability (`ClueVisualiser`).
*   Managing state centrally using the **`useGameStateManager` custom hook** to track **word completion**, **grid focus/selection**, and **block input** on completed words.
*   Applying a **predetermined, fixed color** to completed words upon completion.
*   Synchronizing grid focus/selection with clue display via `useGameStateManager`.

**Styling Approach:** **`styled-components` will be used consistently** for both the reused `CrosswordCore` and all new prototype components (`ClueVisualiser`) to ensure consistency during this phase.

This prototype uses **hardcoded data** (`data/themedPuzzles.ts`) and maintains the feature-based directory structure for easy expansion later.

---

## Project Directory Structure (Simplified Prototype)

```plaintext
prototype-themed-crossword/
├── public/                     # Static assets
├── src/                        # Source code
│   ├── App.tsx                 # Main application component (Calls useGameStateManager, passes state to ThemedCrossword)
│   ├── main.tsx                # Application entry point
│   │
│   ├── Crossword/              # Crossword Feature
│   │   ├── components/         # UI specific to this feature
│   │   │   ├── CrosswordCore/  # Reused components <-- Contains code from old project. Uses styled-components.
│   │   │   │   ├── CrosswordProvider.tsx # {Manages internal grid state/interaction} <-- **Action Item:** Modify for: 1) Input Blocking (via `completedWordIds` prop), 2) Accepting external callbacks (onCellClick, onAnswerCorrect), 3) Disable Storage, 4) Accepting `cellCompletionInfo` prop.
│   │   │   │   ├── CrosswordGrid.tsx     # {Renders SVG grid & input handler} <-- **Action Item:** Consume context for `cellCompletionInfo`, pass `completionInfo` prop to Cell.
│   │   │   │   ├── Cell.tsx              # {Renders SVG cells} <-- **Action Item:** Ensure it can display the fixed completion color (via `completionInfo` prop).
│   │   │   │   ├── context.ts            # {Internal React context} <-- **Action Item:** Modify context value to include `cellCompletionInfo`.
│   │   │   │   └── util.ts               # {Utility functions - Reusable}
│   │   │   ├── ThemedCrossword.tsx # {Adapter/Wrapper} <-- **Action Item:** Implement to connect useGameStateManager state/actions with CrosswordProvider props/callbacks (incl. calculating/passing `completedWordIds`, `cellCompletionInfo`, passing callbacks like `handleCellSelect`, `handleAnswerCorrect`). Styled with styled-components.
│   │   │   └── ClueVisualiser.tsx  # {Basic Clue display} <-- **Action Item:** Build to display active clue text based on props from ThemedCrossword. Implement click handler to call action function (e.g., `handleClueSelect` via props). Styled with styled-components.
│   │   ├── types/              # Types specific to Crossword feature
│   │   │   └── index.ts        # {Contains core types like CluesInput - Reusable}
│   │   └── styles/             # Styles specific to Crossword feature
│   │       ├── CrosswordStyles.ts # {Primary styles for CrosswordCore using styled-components}
│   │       └── index.ts        # {Exports from CrosswordStyles for easier imports}
│   │
│   ├── GameFlow/             # Game Flow / State Feature
│   │   ├── state/              # State management for this feature
│   │   │   └── useGameStateManager.ts # {Central coordinator hook} <-- **Action Item:** Implement state (puzzle, completedWords, focus/selection) using useState. Implement action functions (handleCellSelect, handleClueSelect, completeWord). **Modify `completeWord` to use a fixed color.** Remove Timer integration concepts for prototype. **<-- Updated Filename & Description**
│   │   └── types/              # Types specific to GameFlow/State (e.g., state shape returned by hook)
│   │       └── index.ts
│   │
│   ├── Puzzle/                 # Puzzle Data/Loading Feature
│   │   ├── data/               # Data fetching/definition logic
│   │   │   └── themedPuzzles.ts    # {**Hardcoded Source for Prototype**: Defines puzzle structure (CluesInput format)}
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