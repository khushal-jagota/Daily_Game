import { useState, useCallback, useEffect } from 'react'; // Added useEffect import
import { prototypePuzzle } from '../../Puzzle/data/themedPuzzles';
import { CluesInput, Direction, GridData, CellData, UsedCellData } from '../../Crossword/types';
import { otherDirection, createGridData } from '../../Crossword/components/CrosswordCore/util';
import { produce } from 'immer';

/**
 * Custom hook that manages the game state for the crossword puzzle
 */
export function useGameStateManager() {
  // Initialize state with the prototype puzzle data
  const [puzzleData, setPuzzleData] = useState<CluesInput>(prototypePuzzle);

  // Initialize empty Set for completed words
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());

  // Focus and selection state variables
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedCol, setSelectedCol] = useState<number>(0);
  const [currentDirection, setCurrentDirection] = useState<Direction>('across');
  const [currentNumber, setCurrentNumber] = useState<string>('1'); // TODO: Initialize based on first clue

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
       // console.log(`[calculateAndValidateTargetCell] Target (${targetRow},${targetCol}) out of bounds.`); // Less noisy log
       return null;
    }

    const targetCellData = getCellData(targetRow, targetCol);

    if (!targetCellData?.used) {
      // console.log(`[calculateAndValidateTargetCell] Target (${targetRow},${targetCol}) is invalid or unused.`); // Less noisy log
      return null;
    }

    // console.log(`[calculateAndValidateTargetCell] Target (${targetRow},${targetCol}) is valid.`); // Less noisy log
    return targetCellData as UsedCellData;
  };

  // --- Step 2.75.2: Define updateSelectionState Helper ---
  const updateSelectionState = useCallback((row: number, col: number, direction: Direction, number: string) => {
    console.log(`[updateSelectionState] Setting selection to: R${row}C${col}, Dir: ${direction}, Num: ${number}`);
    setSelectedRow(row);
    setSelectedCol(col);
    setCurrentDirection(direction);
    setCurrentNumber(number);
  }, [setSelectedRow, setSelectedCol, setCurrentDirection, setCurrentNumber]);
  // --- End Step 2.75.2 Helper Definition ---


  /**
   * Helper to check if a cell is editable based on completion status (Strict Locking)
   */
  const isEditableCell = useCallback((row: number, col: number): boolean => {
    const cellData = getCellData(row, col);
    if (!cellData?.used) {
      // console.log(`[isEditableCell] Cell (${row},${col}) not found or not used`); // Less noisy
      return false;
    }
    const usedCell = cellData as UsedCellData;
    const wordIdAcross = usedCell.across ? `${usedCell.across}-across` : null;
    const wordIdDown = usedCell.down ? `${usedCell.down}-down` : null;

    // Strict Locking: Cell is locked if EITHER word passing through it is complete.
    const isLocked =
      (wordIdAcross && completedWords.has(wordIdAcross)) ||
      (wordIdDown && completedWords.has(wordIdDown));

    // console.log(`[isEditableCell] Cell (${row},${col}), wordIdAcross: ${wordIdAcross}, wordIdDown: ${wordIdDown}, Locked: ${isLocked}`); // Less noisy
    return !isLocked;
  }, [getCellData, completedWords]);

  /**
   * Determines if a specific word is correctly filled based on current gridData
   */
  const checkWordCorrectness = useCallback((direction: Direction, number: string): boolean => {
    // console.log(`[checkWordCorrectness] Checking ${direction} ${number}`); // Less noisy

    const clueInfo = puzzleData[direction]?.[number];
    if (!clueInfo) {
      console.warn(`[checkWordCorrectness] Clue not found: ${direction} ${number}`);
      return false;
    }

    const { row, col, answer } = clueInfo;
    if (!answer) {
      console.warn(`[checkWordCorrectness] Answer not found for ${direction} ${number}`);
      return false;
    }

    for (let i = 0; i < answer.length; i++) {
      let r = row;
      let c = col;
      if (direction === 'across') {
        c += i;
      } else {
        r += i;
      }

      const cellData = getCellData(r, c);

      if (!cellData?.used || !cellData.guess) {
        // console.log(`[checkWordCorrectness] Cell (${r},${c}) missing, unused, or no guess`); // Less noisy
        return false; // Word cannot be correct if any cell is empty/unused
      }

      if (cellData.guess.toUpperCase() !== answer[i].toUpperCase()) {
        // console.log(`[checkWordCorrectness] Cell (${r},${c}) incorrect: "${cellData.guess}" vs "${answer[i]}"`); // Less noisy
        return false;
      }
    }

    console.log(`[checkWordCorrectness] ${direction} ${number} is CORRECT!`);
    return true;
  }, [puzzleData, getCellData]);


  // --- NEW useEffect for managing completedWords based on gridData changes ---
  useEffect(() => {
    if (!puzzleData.across || !puzzleData.down) {
      return; // Avoid running if puzzle data isn't fully loaded yet
    }

    console.log('[useEffect - CompletionCheck] Grid data changed, recalculating completed words.');

    const newlyCompletedWords = new Set<string>();

    // Check all across words
    for (const number in puzzleData.across) {
      if (checkWordCorrectness('across', number)) {
        newlyCompletedWords.add(`${number}-across`);
      }
    }

    // Check all down words
    for (const number in puzzleData.down) {
      if (checkWordCorrectness('down', number)) {
        newlyCompletedWords.add(`${number}-down`);
      }
    }

    // Only update state if the set has actually changed to prevent infinite loops/unnecessary renders
    if (
      newlyCompletedWords.size !== completedWords.size ||
      ![...newlyCompletedWords].every(wordId => completedWords.has(wordId))
    ) {
      console.log('[useEffect - CompletionCheck] Completed words set changed. Updating state.', newlyCompletedWords);
      setCompletedWords(newlyCompletedWords);
    } else {
      // console.log('[useEffect - CompletionCheck] Completed words set has not changed.'); // Less noisy
    }

  // Dependencies: Run when gridData changes, or when puzzle/check function changes.
  // completedWords is included to properly compare inside the effect.
  }, [gridData, puzzleData, checkWordCorrectness, completedWords, setCompletedWords]);
  // --- End NEW useEffect ---


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
        newDirection = currentDirection; // Fallback if neither direction is valid (shouldn't happen?)
      }
    }

    const newNumber = usedTargetCell[newDirection] ?? '';

    updateSelectionState(targetRow, targetCol, newDirection, newNumber);

  }, [
      getCellData,
      selectedRow,
      selectedCol,
      currentDirection,
      gridData,
      updateSelectionState
  ]);

  /**
   * Handle movement to a specific clue's starting position
   */
  const handleMoveToClueStart = useCallback((direction: Direction, number: string) => {
    const clueInfo = puzzleData[direction]?.[number]; // Added safe access
    if (!clueInfo) return;

    const row = clueInfo.row;
    const col = clueInfo.col;

    const cellData = getCellData(row, col);
    if (!cellData?.used) return;

    updateSelectionState(row, col, direction, number);

  }, [
      puzzleData,
      getCellData,
      updateSelectionState
  ]);

  /**
   * Handle cell selection (e.g., from direct clicks on a cell)
   */
  const handleCellSelect = useCallback((row: number, col: number) => {
    const cellData = getCellData(row, col);
    if (!cellData?.used) return;

    const usedCell = cellData as UsedCellData;
    let newDirection = currentDirection;

    // Toggle direction if clicking the same cell
    if (row === selectedRow && col === selectedCol) {
      const otherDir = otherDirection(currentDirection);
      if (usedCell[otherDir]) { // Only toggle if the other direction is valid for this cell
        newDirection = otherDir;
      }
    } else { // If clicking a new cell, prefer current direction if valid, else switch
      if (!usedCell[currentDirection]) {
        const otherDir = otherDirection(currentDirection);
        if (usedCell[otherDir]) {
          newDirection = otherDir;
        }
        // If neither is valid, direction remains unchanged (shouldn't happen for used cells)
      }
    }

    const newNumber = usedCell[newDirection] ?? '';

    updateSelectionState(row, col, newDirection, newNumber);

  }, [
      getCellData,
      selectedRow,
      selectedCol,
      currentDirection,
      updateSelectionState
  ]);

  /**
   * Handle direction toggle requests (e.g., from space/tab key or input click)
   */
  const handleDirectionToggle = useCallback(() => {
    const cellData = getCellData(selectedRow, selectedCol);
    if (!cellData?.used) return;

    const usedCell = cellData as UsedCellData;
    const newDirection = otherDirection(currentDirection);
    const newNumber = usedCell[newDirection];

    if (newNumber) { // Only toggle if the other direction is valid for this cell
      setCurrentDirection(newDirection);
      setCurrentNumber(newNumber);
    }
  }, [getCellData, selectedRow, selectedCol, currentDirection, setCurrentDirection, setCurrentNumber]);

  /**
   * Handle guess input for a cell (Simplified: Only updates gridData)
   */
  const handleGuessInput = useCallback((row: number, col: number, char: string) => {
    // console.log(`[handleGuessInput] Input at (${row},${col}): "${char}"`); // Less noisy

    const editable = isEditableCell(row, col);
    // console.log(`[handleGuessInput] Cell is editable: ${editable}`); // Less noisy

    if (editable) {
      setGridData(produce(draft => {
        if (draft[row]?.[col]?.used) {
          // console.log(`[handleGuessInput] Updating cell (${row},${col}) to "${char.toUpperCase()}"`); // Less noisy
          draft[row][col].guess = char.toUpperCase();
        }
      }));
      // *** REMOVED COMPLETION CHECK LOGIC FROM HERE ***
    } else {
      console.log(`[handleGuessInput] Cell (${row},${col}) is locked. Guess not updated.`);
    }

    // Attempt to move to the next cell using the validation helper
    const nextCellData = calculateAndValidateTargetCell(row, col, currentDirection, 1);

    if (nextCellData) {
      let nextRow = row;
      let nextCol = col;
      if (currentDirection === 'across') {
        nextCol += 1;
      } else {
        nextRow += 1;
      }
      const nextNumber = nextCellData[currentDirection] ?? '';
      updateSelectionState(nextRow, nextCol, currentDirection, nextNumber);
    }

  }, [
    isEditableCell,
    setGridData,
    currentDirection,
    updateSelectionState,
    // Removed: getCellData, checkWordCorrectness, completedWords, setCompletedWords
    // calculateAndValidateTargetCell is used internally
  ]);

  /**
   * Handle backspace key (clear current cell if editable, move to previous)
   */
  const handleBackspace = useCallback(() => {
    // console.log(`[handleBackspace] Called at (${selectedRow},${selectedCol})`); // Less noisy

    const editable = isEditableCell(selectedRow, selectedCol);
    // console.log(`[handleBackspace] Cell is editable: ${editable}`); // Less noisy

    if (editable) {
      setGridData(produce(draft => {
        if (draft[selectedRow]?.[selectedCol]?.used) {
          // console.log(`[handleBackspace] Clearing cell (${selectedRow},${selectedCol})`); // Less noisy
          draft[selectedRow][selectedCol].guess = '';
        }
      }));
      // *** NO COMPLETION LOGIC NEEDED HERE ***
    } else {
      console.log(`[handleBackspace] Cell (${selectedRow},${selectedCol}) is locked. Deletion blocked.`);
    }

    // Move to previous cell regardless of whether current cell was cleared
    const prevCellData = calculateAndValidateTargetCell(selectedRow, selectedCol, currentDirection, -1);

    if (prevCellData) {
      let prevRow = selectedRow;
      let prevCol = selectedCol;
      if (currentDirection === 'across') {
        prevCol -= 1;
      } else {
        prevRow -= 1;
      }

      let newDirection = currentDirection;
      if (!prevCellData[currentDirection]) { // Auto-switch direction if needed
          const otherDir = otherDirection(currentDirection);
          if (prevCellData[otherDir]) {
              newDirection = otherDir;
          } else {
              return; // Should not happen if prevCellData is valid
          }
      }
      const newNumber = prevCellData[newDirection] ?? '';
      updateSelectionState(prevRow, prevCol, newDirection, newNumber);
    }

  }, [
    isEditableCell,
    selectedRow,
    selectedCol,
    currentDirection,
    setGridData,
    updateSelectionState
    // calculateAndValidateTargetCell is used internally
  ]);

  /**
   * Handle delete key (clear current cell if editable, no movement)
   */
  const handleDelete = useCallback(() => {
    // console.log(`[handleDelete] Called at (${selectedRow},${selectedCol})`); // Less noisy

    const editable = isEditableCell(selectedRow, selectedCol);
    // console.log(`[handleDelete] Cell is editable: ${editable}`); // Less noisy

    if (editable) {
      setGridData(produce(draft => {
        if (draft[selectedRow]?.[selectedCol]?.used) {
          // console.log(`[handleDelete] Clearing cell (${selectedRow},${selectedCol})`); // Less noisy
          draft[selectedRow][selectedCol].guess = '';
        }
      }));
       // *** NO COMPLETION LOGIC NEEDED HERE ***
    } else {
      console.log(`[handleDelete] Cell (${selectedRow},${selectedCol}) is locked. Deletion blocked.`);
    }
    // No state change needed for selection
  }, [
    isEditableCell,
    selectedRow,
    selectedCol,
    setGridData
  ]);

  // Return state values including the new focus/selection variables and action handlers
  return {
    puzzleData,
    gridData,
    completedWords, // Still return this for use in adapter/visuals
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
    // Don't export setCompletedWords - managed internally by useEffect now
  };
}