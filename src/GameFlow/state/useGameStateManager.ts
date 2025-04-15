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
    const { gridData } = createGridData(prototypePuzzle);
    return gridData;
  });

  // Helper function to get cell data at a specific position
  const getCellData = useCallback((row: number, col: number): CellData | undefined => {
    return gridData?.[row]?.[col];
  }, [gridData]);

  // --- Step 2.75.1 Helper ---
  const calculateAndValidateTargetCell = (row: number, col: number, direction: Direction, delta: number): UsedCellData | null => {
    let targetRow = row;
    let targetCol = col;

    if (direction === 'across') {
      targetCol += delta;
    } else { // direction === 'down'
      targetRow += delta;
    }

    if (!gridData || gridData.length === 0 || !gridData[0] || gridData[0].length === 0) {
       console.warn("[calculateAndValidateTargetCell] Grid data is not available or empty.");
       return null;
    }
    if (targetRow < 0 || targetRow >= gridData.length || targetCol < 0 || targetCol >= gridData[0].length) {
       console.log(`[calculateAndValidateTargetCell] Target (${targetRow},${targetCol}) out of bounds.`);
       return null;
    }

    const targetCellData = getCellData(targetRow, targetCol);

    if (!targetCellData?.used) {
      console.log(`[calculateAndValidateTargetCell] Target (${targetRow},${targetCol}) is invalid or unused.`);
      return null;
    }

    console.log(`[calculateAndValidateTargetCell] Target (${targetRow},${targetCol}) is valid.`);
    return targetCellData as UsedCellData;
  };

  // --- Step 2.75.2: Define updateSelectionState Helper ---
  /**
   * Updates the selection state (row, col, direction, number) atomically.
   * @param row - The new selected row
   * @param col - The new selected column
   * @param direction - The new current direction
   * @param number - The new current clue number
   */
  const updateSelectionState = useCallback((row: number, col: number, direction: Direction, number: string) => {
    console.log(`[updateSelectionState] Setting selection to: R${row}C${col}, Dir: ${direction}, Num: ${number}`);
    setSelectedRow(row);
    setSelectedCol(col);
    setCurrentDirection(direction);
    setCurrentNumber(number);
  }, [setSelectedRow, setSelectedCol, setCurrentDirection, setCurrentNumber]); // Dependencies are the setters
  // --- End Step 2.75.2 Helper Definition ---


  /**
   * Helper to check if a cell is editable based on completion status
   */
  const isEditableCell = useCallback((row: number, col: number): boolean => {
    const cellData = getCellData(row, col);
    if (!cellData?.used) {
      console.log(`[isEditableCell] Cell (${row},${col}) not found or not used`);
      return false;
    }
    const usedCell = cellData as UsedCellData;
    const wordIdAcross = usedCell.across ? `${usedCell.across}-across` : null;
    const wordIdDown = usedCell.down ? `${usedCell.down}-down` : null;
    const isCompleted =
      (wordIdAcross && completedWords.has(wordIdAcross)) ||
      (wordIdDown && completedWords.has(wordIdDown));
    console.log(`[isEditableCell] Cell (${row},${col}), wordIdAcross: ${wordIdAcross}, wordIdDown: ${wordIdDown}, isCompleted: ${isCompleted}`);
    return !isCompleted;
  }, [getCellData, completedWords]);

  /**
   * Handle movement requests (e.g., from arrow keys)
   */
  const handleMoveRequest = useCallback((dRow: number, dCol: number) => {
    let preferredDirection = currentDirection;
    if (dRow !== 0 && dCol === 0) preferredDirection = 'down';
    else if (dCol !== 0 && dRow === 0) preferredDirection = 'across';

    const targetRow = Math.max(0, Math.min(selectedRow + dRow, gridData.length - 1));
    const targetCol = Math.max(0, Math.min(selectedCol + dCol, gridData[0].length - 1));

    const targetCellData = getCellData(targetRow, targetCol);

    if (!targetCellData?.used) {
      return;
    }
    const usedTargetCell = targetCellData as UsedCellData;

    let newDirection = preferredDirection;
    if (!usedTargetCell[newDirection]) {
      const otherDir = otherDirection(newDirection);
      if (usedTargetCell[otherDir]) {
        newDirection = otherDir;
      } else {
        newDirection = currentDirection;
      }
    }

    const newNumber = usedTargetCell[newDirection] ?? '';

    // Update state using the helper
    updateSelectionState(targetRow, targetCol, newDirection, newNumber);

  }, [
      getCellData, // Needed for targetCellData lookup
      selectedRow,
      selectedCol,
      currentDirection,
      gridData, // Needed for boundary checks
      updateSelectionState // Added dependency
      // Removed: setSelectedRow, setSelectedCol, setCurrentDirection, setCurrentNumber
  ]);

  /**
   * Handle movement to a specific clue's starting position
   */
  const handleMoveToClueStart = useCallback((direction: Direction, number: string) => {
    const clueInfo = puzzleData[direction][number];
    if (!clueInfo) return;

    const row = clueInfo.row;
    const col = clueInfo.col;

    const cellData = getCellData(row, col);
    if (!cellData?.used) return;

    // Update state using the helper
    updateSelectionState(row, col, direction, number);

  }, [
      puzzleData,
      getCellData,
      updateSelectionState // Added dependency
      // Removed: setSelectedRow, setSelectedCol, setCurrentDirection, setCurrentNumber
  ]);

  /**
   * Handle cell selection (e.g., from direct clicks on a cell)
   */
  const handleCellSelect = useCallback((row: number, col: number) => {
    const cellData = getCellData(row, col);
    if (!cellData?.used) return;

    const usedCell = cellData as UsedCellData;
    let newDirection = currentDirection;

    if (row === selectedRow && col === selectedCol) {
      const otherDir = otherDirection(currentDirection);
      if (usedCell[otherDir]) {
        newDirection = otherDir;
      }
    } else {
      if (!usedCell[currentDirection]) {
        const otherDir = otherDirection(currentDirection);
        if (usedCell[otherDir]) {
          newDirection = otherDir;
        }
      }
    }

    const newNumber = usedCell[newDirection] ?? '';

    // Update state using the helper
    updateSelectionState(row, col, newDirection, newNumber);

  }, [
      getCellData,
      selectedRow,
      selectedCol,
      currentDirection,
      updateSelectionState // Added dependency
      // Removed: setSelectedRow, setSelectedCol, setCurrentDirection, setCurrentNumber
  ]);

  /**
   * Handle direction toggle requests (e.g., from space/tab key or input click)
   * NOTE: This handler is NOT refactored as it only changes direction/number, not row/col.
   */
  const handleDirectionToggle = useCallback(() => {
    const cellData = getCellData(selectedRow, selectedCol);
    if (!cellData?.used) return;

    const usedCell = cellData as UsedCellData;
    const newDirection = otherDirection(currentDirection);
    const newNumber = usedCell[newDirection]; // Access number property safely

    if (newNumber) {
      // Still need individual setters here as updateSelectionState requires row/col too
      setCurrentDirection(newDirection);
      setCurrentNumber(newNumber);
    }
  }, [getCellData, selectedRow, selectedCol, currentDirection, setCurrentDirection, setCurrentNumber]); // Dependencies remain unchanged

  /**
   * Handle guess input for a cell
   */
  const handleGuessInput = useCallback((row: number, col: number, char: string) => {
    console.log(`[handleGuessInput] Input at (${row},${col}): "${char}"`);

    const editable = isEditableCell(row, col);
    console.log(`[handleGuessInput] Cell is editable: ${editable}`);

    if (editable) {
      setGridData(produce(draft => {
        if (draft[row]?.[col]?.used) {
          console.log(`[handleGuessInput] Updating cell (${row},${col}) from "${draft[row][col].guess}" to "${char.toUpperCase()}"`);
          draft[row][col].guess = char.toUpperCase();
        } else {
          console.warn(`[handleGuessInput] Attempted to update non-existent or unused cell (${row},${col})`);
        }
      }));
    } else {
      console.log(`[handleGuessInput] Cell (${row},${col}) is not editable. Guess not updated.`);
    }

    // Attempt to move to the next cell using the validation helper
    const nextCellData = calculateAndValidateTargetCell(row, col, currentDirection, 1);

    if (nextCellData) {
      // Valid next cell found. Calculate its coordinates.
      let nextRow = row;
      let nextCol = col;
      if (currentDirection === 'across') {
        nextCol += 1;
      } else { // direction === 'down'
        nextRow += 1;
      }

      // Determine the correct number for the next cell *in the current direction*
      // Use optional chaining and nullish coalescing for safety
      const nextNumber = nextCellData[currentDirection] ?? '';

      console.log(`[handleGuessInput] Moving focus to next cell: (${nextRow},${nextCol})`);
      // Update selection state using the helper, keeping the current direction
      updateSelectionState(nextRow, nextCol, currentDirection, nextNumber);

    } else {
      console.log(`[handleGuessInput] Next cell is invalid or unused. Focus not moved.`);
    }

  }, [
    isEditableCell,
    setGridData,
    currentDirection,
    // calculateAndValidateTargetCell is defined in scope
    updateSelectionState // Added dependency
    // Removed: handleCellSelect
  ]);

  /**
   * Handle backspace key (move to previous cell and clear current cell if editable)
   */
  const handleBackspace = useCallback(() => {
    console.log(`[handleBackspace] Called at (${selectedRow},${selectedCol})`);

    const editable = isEditableCell(selectedRow, selectedCol);
    console.log(`[handleBackspace] Cell is editable: ${editable}`);

    if (editable) {
      setGridData(produce(draft => {
        if (draft[selectedRow]?.[selectedCol]?.used) {
          console.log(`[handleBackspace] Clearing cell (${selectedRow},${selectedCol}) from "${draft[selectedRow][selectedCol].guess}" to ""`);
          draft[selectedRow][selectedCol].guess = '';
        }
      }));
    }

    // Move to previous cell regardless of whether current cell was cleared
    const prevCellData = calculateAndValidateTargetCell(selectedRow, selectedCol, currentDirection, -1);

    if (prevCellData) {
      let prevRow = selectedRow;
      let prevCol = selectedCol;
      if (currentDirection === 'across') {
        prevCol -= 1;
      } else { // direction === 'down'
        prevRow -= 1;
      }

      let newDirection = currentDirection;
      if (!prevCellData[currentDirection]) {
          const otherDir = otherDirection(currentDirection);
          if (prevCellData[otherDir]) {
              newDirection = otherDir;
          } else {
              console.warn(`[handleBackspace] Previous cell (${prevRow},${prevCol}) is used but seems invalid for both directions.`);
              return;
          }
      }
      const newNumber = prevCellData[newDirection] ?? '';

      console.log(`[handleBackspace] Moving to previous cell (${prevRow},${prevCol}), direction: ${newDirection}, number: ${newNumber}`);

      // Update state using the helper
      updateSelectionState(prevRow, prevCol, newDirection, newNumber);

    } else {
      console.log(`[handleBackspace] Previous cell is invalid or unused. Focus not moved.`);
    }
  }, [
    isEditableCell,
    // calculateAndValidateTargetCell is defined in scope
    selectedRow,
    selectedCol,
    currentDirection,
    setGridData,
    updateSelectionState // Added dependency
    // Removed: setSelectedRow, setSelectedCol, setCurrentDirection, setCurrentNumber
    // getCellData is used by isEditableCell and calculateAndValidateTargetCell
    // gridData is used by calculateAndValidateTargetCell
  ]);

  /**
   * Handle delete key (clear current cell if editable, no movement)
   */
  const handleDelete = useCallback(() => {
    console.log(`[handleDelete] Called at (${selectedRow},${selectedCol})`);

    const editable = isEditableCell(selectedRow, selectedCol);
    console.log(`[handleDelete] Cell is editable: ${editable}`);

    if (editable) {
      setGridData(produce(draft => {
        if (draft[selectedRow]?.[selectedCol]?.used) {
          console.log(`[handleDelete] Clearing cell (${selectedRow},${selectedCol}) from "${draft[selectedRow][selectedCol].guess}" to ""`);
          draft[selectedRow][selectedCol].guess = '';
        }
      }));
    }
    // No state change needed for selection
  }, [
    isEditableCell,
    selectedRow,
    selectedCol,
    setGridData
    // getCellData is used by isEditableCell
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
    handleDirectionToggle, // Still exported, using individual setters
    handleBackspace,
    handleDelete,
    handleGuessInput,
    setCompletedWords,
    // Not exporting internal helpers: calculateAndValidateTargetCell, updateSelectionState
  };
}