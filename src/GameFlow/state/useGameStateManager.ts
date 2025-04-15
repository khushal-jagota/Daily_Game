import { useState, useCallback } from 'react';
import { prototypePuzzle } from '../../Puzzle/data/themedPuzzles';
import { CluesInput, Direction, GridData, CellData, UsedCellData } from '../../Crossword/types';
import { otherDirection, createGridData } from '../../Crossword/components/CrosswordCore/util';
import { produce } from 'immer';

/**
 * Custom hook that manages the game state for the crossword puzzle
 * In Phase 2, it manages focus/selection state and puzzle data
 */
export function useGameStateManager() {
  // Initialize state with the prototype puzzle data
  const [puzzleData, setPuzzleData] = useState<CluesInput>(prototypePuzzle);
  
  // Initialize empty Set for completed words (stub for Phase 3)
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());
  
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
   * Helper to check if a cell is editable based on completion status
   * Uses internal completedWords state to validate editability
   */
  const isEditableCell = useCallback((row: number, col: number): boolean => {
    // Get cell data
    const cellData = getCellData(row, col);
    if (!cellData?.used) {
      console.log(`[isEditableCell] Cell (${row},${col}) not found or not used`);
      return false;
    }

    // Get word IDs for this cell
    const wordIdAcross = cellData.across ? `${cellData.across}-across` : null;
    const wordIdDown = cellData.down ? `${cellData.down}-down` : null;
    
    // Check if either word is completed
    const isCompleted = 
      (wordIdAcross && completedWords.has(wordIdAcross)) || 
      (wordIdDown && completedWords.has(wordIdDown));
    
    console.log(`[isEditableCell] Cell (${row},${col}), wordIdAcross: ${wordIdAcross}, wordIdDown: ${wordIdDown}, isCompleted: ${isCompleted}`);
    
    // Return false if the cell belongs to any completed word, true otherwise
    return !isCompleted;
  }, [getCellData, completedWords]);
  
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
   * Handle guess input for a cell
   * @param row - The row of the cell
   * @param col - The column of the cell
   * @param char - The character to input
   */
  const handleGuessInput = useCallback((row: number, col: number, char: string) => {
    console.log(`[handleGuessInput] Input at (${row},${col}): "${char}"`);

    // Check if the cell is editable
    const editable = isEditableCell(row, col);
    console.log(`[handleGuessInput] Cell is editable: ${editable}`);

    // --- Step 1: Conditionally update the guess ---
    if (editable) {
      // Update the grid data with proper immutability using Immer
      setGridData(produce(draft => {
        // Ensure the cell exists and is used before attempting to update
        if (draft[row]?.[col]?.used) {
          console.log(`[handleGuessInput] Updating cell (${row},${col}) from "${draft[row][col].guess}" to "${char.toUpperCase()}"`);
          // Always store uppercase guesses
          draft[row][col].guess = char.toUpperCase();
        } else {
          console.warn(`[handleGuessInput] Attempted to update non-existent or unused cell (${row},${col})`);
        }
      }));
    } else {
      console.log(`[handleGuessInput] Cell (${row},${col}) is not editable. Guess not updated.`);
    }

    // --- Step 2: Always attempt to move to the next cell ---
    let nextRow = row;
    let nextCol = col;

    if (currentDirection === 'across') {
      nextCol += 1; // Move right
    } else {
      nextRow += 1; // Move down
    }
    console.log(`[handleGuessInput] Calculating next cell target: (${nextRow},${nextCol}) based on direction "${currentDirection}"`);

    // Check if the next cell is valid and used within the grid
    const nextCellData = getCellData(nextRow, nextCol);

    if (nextCellData?.used) {
      console.log(`[handleGuessInput] Moving focus to next cell: (${nextRow},${nextCol})`);
      // Update selection state - Assuming handleCellSelect updates row, col, and number/direction correctly
      // If handleCellSelect doesn't handle number/direction update correctly on simple moves,
      // you might need separate setSelectedRow/setSelectedCol calls here.
      // Using handleCellSelect is often cleaner if it encapsulates all selection logic.
      handleCellSelect(nextRow, nextCol);

      // --- Optional Refinement: ---
      // If handleCellSelect primarily handles clicks and doesn't perfectly replicate
      // simple sequential movement logic (e.g., updating currentNumber implicitly),
      // you might replace the handleCellSelect call above with direct state setters:
      // setSelectedRow(nextRow);
      // setSelectedCol(nextCol);
      // // Potentially update currentNumber based on nextCellData - requires puzzleData access
      // const nextNumber = currentDirection === 'across' ? nextCellData.across?.number : nextCellData.down?.number;
      // if (nextNumber && nextNumber !== currentNumber) {
      //   setCurrentNumber(nextNumber);
      //   console.log(`[handleGuessInput] Updated current number to ${nextNumber}`);
      // }
      // --- End Optional Refinement ---

    } else {
      console.log(`[handleGuessInput] Next cell (${nextRow},${nextCol}) is invalid or unused. Focus not moved.`);
      // Do not move focus if the next cell isn't part of the puzzle grid
    }

  }, [
    isEditableCell,
    setGridData,
    currentDirection,
    getCellData,
    handleCellSelect, // Or setSelectedRow, setSelectedCol, setCurrentNumber, puzzleData if using direct setters
    // Add other dependencies like selectedRow, selectedCol if needed by move logic helpers (if extracted)
  ]); // Ensure all dependencies used are listed here
  
  /**
   * Handle backspace key (move to previous cell and clear current cell if editable)
   */
  const handleBackspace = useCallback(() => {
    console.log(`[handleBackspace] Called at (${selectedRow},${selectedCol})`);
    
    // Check if the current cell is editable
    const editable = isEditableCell(selectedRow, selectedCol);
    console.log(`[handleBackspace] Cell is editable: ${editable}`);
    
    if (editable) {
      // Clear the current cell's guess if editable, using proper immutability
      setGridData(produce(draft => {
        if (draft[selectedRow]?.[selectedCol]?.used) {
          console.log(`[handleBackspace] Clearing cell (${selectedRow},${selectedCol}) from "${draft[selectedRow][selectedCol].guess}" to ""`);
          draft[selectedRow][selectedCol].guess = '';
        }
      }));
    }
    
    // Move to previous cell regardless of whether current cell was cleared
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
    
    console.log(`[handleBackspace] Moving to previous cell (${prevRow},${prevCol}), direction: ${newDirection}, number: ${newNumber}`);
    
    // Update state to move to the previous cell
    setSelectedRow(prevRow);
    setSelectedCol(prevCol);
    setCurrentDirection(newDirection);
    setCurrentNumber(newNumber);
  }, [
    isEditableCell, 
    getCellData, 
    selectedRow, 
    selectedCol, 
    currentDirection,
    setGridData,
    setSelectedRow,
    setSelectedCol,
    setCurrentDirection,
    setCurrentNumber
    // Intentionally excluding completedWordIds as we now use internal state
  ]);
  
  /**
   * Handle delete key (clear current cell if editable, no movement)
   */
  const handleDelete = useCallback(() => {
    console.log(`[handleDelete] Called at (${selectedRow},${selectedCol})`);
    
    // Check if the current cell is editable
    const editable = isEditableCell(selectedRow, selectedCol);
    console.log(`[handleDelete] Cell is editable: ${editable}`);
    
    if (editable) {
      // Clear the current cell's guess if editable, using proper immutability
      setGridData(produce(draft => {
        if (draft[selectedRow]?.[selectedCol]?.used) {
          console.log(`[handleDelete] Clearing cell (${selectedRow},${selectedCol}) from "${draft[selectedRow][selectedCol].guess}" to ""`);
          draft[selectedRow][selectedCol].guess = '';
        }
      }));
    }
    
    // Delete does not change cell selection or direction
  }, [
    isEditableCell,
    selectedRow,
    selectedCol,
    setGridData
    // Intentionally excluding completedWordIds as we now use internal state
  ]);
  
  // Return state values including the new focus/selection variables and action handlers
  return {
    puzzleData,
    gridData,
    completedWords,
    selectedRow,
    selectedCol,
    currentDirection,
    currentNumber,
    // Export action handlers
    handleMoveRequest,
    handleMoveToClueStart,
    handleCellSelect,
    handleDirectionToggle,
    handleBackspace,
    handleDelete,
    handleGuessInput,
    setCompletedWords,
  };
} 