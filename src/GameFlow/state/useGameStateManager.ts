import { useState } from 'react';
import { prototypePuzzle } from '../../Puzzle/data/themedPuzzles';
import { CluesInput } from '../../Crossword/types';

/**
 * Custom hook that manages the game state for the crossword puzzle
 * In Phase 1, it only exposes the puzzle data
 */
export function useGameStateManager() {
  // Initialize state with the prototype puzzle data
  const [puzzleData, setPuzzleData] = useState<CluesInput>(prototypePuzzle);
  
  // Initialize empty object for completed words (will be used in later phases)
  const [completedWords, setCompletedWords] = useState<Record<string, any>>({});
  
  // For Phase 1, only return the puzzle data
  return {
    puzzleData,
  };
} 