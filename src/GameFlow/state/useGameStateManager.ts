import { useState, useCallback } from 'react';
import { prototypePuzzle } from '../../Puzzle/data/themedPuzzles';
import { CluesInput, Direction, GridData, CellData, UsedCellData } from '../../Crossword/types';
import { otherDirection, createGridData } from '../../Crossword/components/CrosswordCore/util';

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
  
  // Compute the grid data once for lookups
  const [gridData, setGridData] = useState<GridData>(() => {
    const { gridData } = createGridData(puzzleData);
    return gridData;
  });
  
  // Helper function to get cell data at a specific position
  const getCellData = useCallback((row: number, col: number): CellData | undefined => {
    return gridData?.[row]?.[col];
  }, [gridData]);
  
  /**
   * Handle movement requests (e.g., from arrow keys)
   * @param dRow - The row displacement (-1, 0, 1)
   * @param dCol - The column displacement (-1, 0, 1)
   */
  const handleMoveRequest = useCallback((dRow: number, dCol: number) => {
    // Prefer direction based on movement axis
    let preferredDirection = currentDirection;
    if (dRow !== 0 && dCol === 0) preferredDirection = 'down';
    else if (dCol !== 0 && dRow === 0) preferredDirection = 'across';

    // Calculate target position with boundary checks
    const targetRow = Math.max(0, Math.min(selectedRow + dRow, gridData.length - 1));
    const targetCol = Math.max(0, Math.min(selectedCol + dCol, gridData[0].length - 1));
    
    const targetCellData = getCellData(targetRow, targetCol);

    // If target is invalid or unused, don't move
    if (!targetCellData?.used) {
      return;
    }

    // Determine final direction and number
    let newDirection = preferredDirection;
    if (!(targetCellData as UsedCellData)[newDirection]) { // If preferred direction not valid for target
      const otherDir = otherDirection(newDirection);
      if ((targetCellData as UsedCellData)[otherDir]) { // Try other direction
        newDirection = otherDir;
      } else {
        // If neither valid (shouldn't happen for used cell), keep current direction
        newDirection = currentDirection;
      }
    }

    const newNumber = (targetCellData as UsedCellData)[newDirection] ?? '';

    // Update state
    setSelectedRow(targetRow);
    setSelectedCol(targetCol);
    setCurrentDirection(newDirection);
    setCurrentNumber(newNumber);
  }, [getCellData, selectedRow, selectedCol, currentDirection, gridData]);

  /**
   * Handle movement to a specific clue's starting position
   * @param direction - The clue direction ('across' or 'down')
   * @param number - The clue number
   */
  const handleMoveToClueStart = useCallback((direction: Direction, number: string) => {
    // Find the starting row and column for the specified clue
    const clueInfo = puzzleData[direction][number];
    
    if (!clueInfo) {
      return; // Clue not found
    }
    
    const row = clueInfo.row;
    const col = clueInfo.col;
    
    // Verify the cell is valid
    const cellData = getCellData(row, col);
    if (!cellData?.used) {
      return;
    }
    
    // Update state to move to the clue start
    setSelectedRow(row);
    setSelectedCol(col);
    setCurrentDirection(direction);
    setCurrentNumber(number);
  }, [puzzleData, getCellData]);
  
  /**
   * Handle cell selection (e.g., from direct clicks on a cell)
   * @param row - The row of the clicked cell
   * @param col - The column of the clicked cell
   */
  const handleCellSelect = useCallback((row: number, col: number) => {
    const cellData = getCellData(row, col);

    if (!cellData?.used) {
      return; // Ignore clicks on unused cells
    }

    let newDirection = currentDirection;
    
    // If clicking the already selected cell, toggle direction if possible
    if (row === selectedRow && col === selectedCol) {
      const otherDir = otherDirection(currentDirection);
      if ((cellData as UsedCellData)[otherDir]) { 
        // Check if the other direction is valid for this cell
        newDirection = otherDir;
      }
    } else {
      // If moving to a new cell, prefer the current direction if valid, else switch
      if (!(cellData as UsedCellData)[currentDirection]) {
        const otherDir = otherDirection(currentDirection);
        if ((cellData as UsedCellData)[otherDir]) {
          newDirection = otherDir;
        }
        // If neither direction is valid (shouldn't happen for used cell), keep current
      }
    }

    const newNumber = (cellData as UsedCellData)[newDirection] ?? '';

    // Update state
    setSelectedRow(row);
    setSelectedCol(col);
    setCurrentDirection(newDirection);
    setCurrentNumber(newNumber);
  }, [getCellData, selectedRow, selectedCol, currentDirection]);
  
  /**
   * Handle direction toggle requests (e.g., from space/tab key or input click)
   */
  const handleDirectionToggle = useCallback(() => {
    const cellData = getCellData(selectedRow, selectedCol);

    if (!cellData?.used) {
      return; // Cannot toggle if not on a used cell
    }

    const newDirection = otherDirection(currentDirection);
    const newNumber = (cellData as UsedCellData)[newDirection]; 

    // Only toggle if the new direction is valid for the current cell
    if (newNumber) {
      setCurrentDirection(newDirection);
      setCurrentNumber(newNumber);
    }
  }, [getCellData, selectedRow, selectedCol, currentDirection]);
  
  /**
   * Handle character entry auto-move (called after a character is entered)
   * @param row - The row where the character was entered
   * @param col - The column where the character was entered
   */
  const handleCharacterEntered = useCallback((row: number, col: number) => {
    // Calculate the next cell based on the current direction
    let nextRow = row;
    let nextCol = col;
    
    if (currentDirection === 'across') {
      nextCol += 1; // Move right
    } else {
      nextRow += 1; // Move down
    }
    
    // Check if the next cell is valid
    const nextCellData = getCellData(nextRow, nextCol);
    
    // If next cell is invalid or unused, don't move
    if (!nextCellData?.used) {
      return;
    }
    
    // Determine if the next cell is part of the same word/clue number
    let newDirection = currentDirection;
    if (!(nextCellData as UsedCellData)[currentDirection]) {
      // Next cell is not part of the current direction's word
      // Try the other direction if we need to switch
      const otherDir = otherDirection(currentDirection);
      if ((nextCellData as UsedCellData)[otherDir]) {
        newDirection = otherDir;
      } else {
        // If neither direction is valid for next cell, don't move
        return;
      }
    }
    
    const newNumber = (nextCellData as UsedCellData)[newDirection] ?? '';
    
    // Update state to move to the next cell
    setSelectedRow(nextRow);
    setSelectedCol(nextCol);
    setCurrentDirection(newDirection);
    setCurrentNumber(newNumber);
  }, [getCellData, currentDirection]);
  
  /**
   * Handle backspace key (move to previous cell)
   */
  const handleBackspace = useCallback(() => {
    // Calculate the previous cell based on the current direction
    let prevRow = selectedRow;
    let prevCol = selectedCol;
    
    if (currentDirection === 'across') {
      prevCol -= 1; // Move left
    } else {
      prevRow -= 1; // Move up
    }
    
    // Check if the previous cell is valid
    const prevCellData = getCellData(prevRow, prevCol);
    
    // If previous cell is invalid or unused, don't move
    if (!prevCellData?.used) {
      return;
    }
    
    // Determine if the previous cell has the same direction/number
    let newDirection = currentDirection;
    if (!(prevCellData as UsedCellData)[currentDirection]) {
      // Previous cell is not part of the current direction's word
      // Try the other direction if we need to switch
      const otherDir = otherDirection(currentDirection);
      if ((prevCellData as UsedCellData)[otherDir]) {
        newDirection = otherDir;
      } else {
        // If neither direction is valid for previous cell, don't move
        return;
      }
    }
    
    const newNumber = (prevCellData as UsedCellData)[newDirection] ?? '';
    
    // Update state to move to the previous cell
    setSelectedRow(prevRow);
    setSelectedCol(prevCol);
    setCurrentDirection(newDirection);
    setCurrentNumber(newNumber);
  }, [getCellData, selectedRow, selectedCol, currentDirection]);
  
  /**
   * Handle delete key (no movement)
   */
  const handleDelete = useCallback(() => {
    // Delete does not change cell selection or direction
    // When central guess management is implemented, 
    // this will clear the current cell's guess
    
    // For now, this is a no-op for selection state
    return;
  }, []);
  
  // Return state values including the new focus/selection variables and action handlers
  return {
    puzzleData,
    selectedRow,
    selectedCol,
    currentDirection,
    currentNumber,
    // Export action handlers
    handleMoveRequest,
    handleMoveToClueStart,
    handleCellSelect,
    handleDirectionToggle,
    handleCharacterEntered,
    handleBackspace,
    handleDelete,
  };
} 