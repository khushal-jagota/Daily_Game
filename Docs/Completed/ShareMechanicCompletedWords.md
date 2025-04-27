# Share Mechanic - Completed Words Map

This document explains how the share mechanic accesses and utilizes the completed words map in the crossword game.

## Overview

When a user completes the crossword puzzle, the share feature generates an image showing the completed grid with cells colored according to when they were completed. This requires access to a map that tracks which words have been completed and at which stage they were completed.

## Data Structure

The completed words are tracked in a `Map<string, CompletionData>` where:
- Keys are formatted as `${number}-${direction}` (e.g., "1-across")
- Values are objects with a `stage` property (a number from 1-5)

```typescript
interface CompletionData {
  stage: number;
}
```

## State Management

The map is maintained in the `useGameStateManager` hook:

```typescript
export function useGameStateManager() {
  // Initialize empty Map for completed words with their stage information
  const [completedWords, setCompletedWords] = useState<Map<string, CompletionData>>(new Map());
  
  // ... (other state and logic)

  // This useEffect populates the completedWords map
  useEffect(() => {
    if (!puzzleData.across || !puzzleData.down) {
      return;
    }

    // Create a map for newly completed words
    const newlyCompletedWords = new Map<string, CompletionData>();
    
    // Check all across words
    for (const number in puzzleData.across) {
      if (checkWordCorrectness('across', number)) {
        const wordId = `${number}-across`;
        // Preserve existing stage if word was already completed
        const existingData = completedWords.get(wordId);
        if (existingData) {
          newlyCompletedWords.set(wordId, existingData);
        } else {
          // Word is newly completed, use current stage
          const stageToRecord = stageForNextCompletionCheckRef.current;
          newlyCompletedWords.set(wordId, { stage: stageToRecord });
        }
      }
    }

    // Similar check for down words
    for (const number in puzzleData.down) {
      if (checkWordCorrectness('down', number)) {
        const wordId = `${number}-down`;
        // ... (similar logic)
      }
    }

    // Update state if map has changed
    if (mapChanged) {
      setCompletedWords(newlyCompletedWords);
    }
  }, [gridData, puzzleData, checkWordCorrectness, completedWords]);

  // Return state including completedWords
  return {
    // ... other state
    completedWords,
    // ... other methods
  };
}
```

## Canvas Data Interface

When the game is complete, the share modal receives this map through the `CanvasData` interface:

```typescript
export interface CanvasData {
  puzzleData: CluesInput;
  gridData: GridData;
  completedWords: Map<string, { stage: number }>;
  elapsedTime: number;
  currentStage: number;
  theme: typeof crosswordTheme;
  
  // Optional puzzle metadata
  puzzleNumber?: string | number;
  puzzleThemeName?: string;
}
```

## Rendering Logic

The canvas renderer uses the map to determine the appropriate color for each cell based on the highest stage of any completed word that passes through the cell:

```typescript
function findMaxStageForCell(
  cellData: CellData,
  completedWords: Map<string, { stage: number }>
): number {
  if (!cellData.used) return 0;

  let maxStage = 0;

  // Check across clue if it exists
  if (cellData.across) {
    const acrossWord = `${cellData.across}-across`;
    const completionAcross = completedWords.get(acrossWord);
    if (completionAcross) {
      maxStage = Math.max(maxStage, completionAcross.stage);
    }
  }

  // Check down clue if it exists
  if (cellData.down) {
    const downWord = `${cellData.down}-down`;
    const completionDown = completedWords.get(downWord);
    if (completionDown) {
      maxStage = Math.max(maxStage, completionDown.stage);
    }
  }

  return maxStage;
}
```

## Integration in App Component

The App component creates the `CanvasData` object containing the map to pass to the `ResultModal`:

```typescript
const canvasData = useMemo(() => ({
  puzzleData: gameState.puzzleData,
  gridData: gameState.gridData,
  completedWords: gameState.completedWords, // Pass the map directly from gameState
  elapsedTime: elapsedTime,
  currentStage: currentStage,
  theme: crosswordTheme,
  puzzleNumber: puzzleNumber,
  puzzleThemeName: puzzleThemeName
}), [gameState, elapsedTime, currentStage]);
```

## Cell Color Determination

When rendering the share image, the cell colors are determined based on the stage at which the words passing through them were completed:

```typescript
function getCellFillColor(stage: number, theme: typeof crosswordTheme): string {
  switch (stage) {
    case 1: return theme.completionStage1Background;
    case 2: return theme.completionStage2Background;
    case 3: return theme.completionStage3Background;
    case 4: return theme.completionStage4Background;
    case 5: return theme.completionStage5Background;
    default: return theme.cellBackground; // Default background if stage is 0 or invalid
  }
}
```

## Summary

The share mechanic relies on the `completedWords` map from the game state manager to determine how to color cells in the shared image. For cells that are part of multiple completed words, it uses the highest stage value to determine the color, providing a visual representation of the player's progress and solution strategy. 