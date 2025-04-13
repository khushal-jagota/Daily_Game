import { useState } from 'react';
import { prototypePuzzle } from '../../Puzzle/data/themedPuzzles';
import { CluesInput, Direction } from '../../Crossword/types';

/**
 * Custom hook that manages the game state for the crossword puzzle
 * In Phase 2, it manages focus/selection state and puzzle data
 */
export function useGameStateManager() {
  // Initialize state with the prototype puzzle data
  const [puzzleData, setPuzzleData] = useState<CluesInput>(prototypePuzzle);
  
  // Initialize empty object for completed words (will be used in later phases)
  const [completedWords, setCompletedWords] = useState<Record<string, any>>({});
  
  // Focus and selection state variables
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedCol, setSelectedCol] = useState<number>(0);
  const [currentDirection, setCurrentDirection] = useState<Direction>('across');
  const [currentNumber, setCurrentNumber] = useState<string>('1');
  
  // Return state values including the new focus/selection variables
  return {
    puzzleData,
    selectedRow,
    selectedCol,
    currentDirection,
    currentNumber,
  };
} 