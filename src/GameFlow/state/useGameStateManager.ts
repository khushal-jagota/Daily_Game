import { useState, useCallback, useEffect, useRef, useMemo } from 'react'; // Added useRef and useMemo imports
import { prototypePuzzle } from '../../Puzzle/data/themedPuzzles';
import { CluesInput, Direction, GridData, CellData, UsedCellData } from '../../Crossword/types';
import { otherDirection, createGridData } from '../../Crossword/components/CrosswordCore/util';
import { produce, WritableDraft } from 'immer';
import { TRANSITION_DURATIONS } from '../../Crossword/styles/GridTransitions';

// Interface for word completion data
interface CompletionData {
  stage: number;
}

/**
 * Custom hook that manages the game state for the crossword puzzle
 * @param initialPuzzleData Optional initial puzzle data to use instead of the prototype
 */
export function useGameStateManager(initialPuzzleData?: CluesInput) {
  // Initialize state with the provided puzzle data or fall back to the prototype
  const [puzzleData, setPuzzleData] = useState<CluesInput>(initialPuzzleData || prototypePuzzle);

  // Initialize empty Map for completed words with their stage information
  const [completedWords, setCompletedWords] = useState<Map<string, CompletionData>>(new Map());
  
  // Track recently completed words for animation
  const [recentlyCompletedWordIds, setRecentlyCompletedWordIds] = useState<Set<string>>(new Set());
  
  // NEW state for two-phase commit
  const [pendingCompletedWordIds, setPendingCompletedWordIds] = useState<Set<string>>(new Set());
  
  // Ref for the timeout to clear recently completed words
  const recentlyCompletedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus and selection state variables
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedCol, setSelectedCol] = useState<number>(0);
  const [currentDirection, setCurrentDirection] = useState<Direction>('across');
  const [currentNumber, setCurrentNumber] = useState<string>('1'); // TODO: Initialize based on first clue

  // Compute the grid data once for lookups
  const [gridData, setGridData] = useState<GridData>(() => {
    const data = initialPuzzleData || prototypePuzzle;
    const { gridData } = createGridData(data);
    return gridData;
  });

  // Recalculate grid data if initialPuzzleData changes (i.e., when Firebase data is loaded)
  useEffect(() => {
    if (initialPuzzleData) {
      const { gridData: newGridData } = createGridData(initialPuzzleData);
      setGridData(newGridData);
      
      // Also update puzzleData to ensure consistency
      setPuzzleData(initialPuzzleData);
    }
  }, [initialPuzzleData]);

  // Ref to track the current stage for the next completion check
  const stageForNextCompletionCheckRef = useRef<number>(0);

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

  // Initialize selection to focus on first letter of first across clue
  useEffect(() => {
    // Only run if puzzleData is available
    if (puzzleData?.across?.['1']) {
      const firstClue = puzzleData.across['1'];
      // Set the selection to the first letter's position
      updateSelectionState(firstClue.row, firstClue.col, 'across', '1');
      console.log(`[InitialFocus] Set to first letter of 1-across: (${firstClue.row},${firstClue.col})`);
    }
  }, [puzzleData, updateSelectionState]); // Only re-run if puzzleData or updateSelectionState changes

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
    // Use Map.has() instead of Set.has()
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

  // Calculate if the game is complete (all words completed)
  const isGameComplete = useMemo(() => {
    if (!puzzleData || !puzzleData.across || !puzzleData.down) {
      return false;
    }
    
    // Count total number of words in the puzzle
    const totalWords = Object.keys(puzzleData.across).length + Object.keys(puzzleData.down).length;
    
    // Check if all words are completed
    return completedWords.size === totalWords;
  }, [puzzleData, completedWords]);

  // --- NEW useEffect for managing completedWords based on gridData changes ---
  useEffect(() => {
    if (!puzzleData.across || !puzzleData.down) {
      return; // Avoid running if puzzle data isn't fully loaded yet
    }

    console.log('[useEffect - CompletionCheck] Grid data changed, recalculating completed words.');

    // Create a new Map with placeholder stage value (0)
    const newlyCompletedWords = new Map<string, CompletionData>();
    // Track word IDs that were just completed in this check
    const justCompletedWords = new Set<string>();

    // Check all across words
    for (const number in puzzleData.across) {
      if (checkWordCorrectness('across', number)) {
        const wordId = `${number}-across`;
        // Preserve the existing stage if the word was already completed
        const existingData = completedWords.get(wordId);
        if (existingData) {
          // Word was already completed, keep its stage
          newlyCompletedWords.set(wordId, existingData);
        } else {
          // Word is newly completed, use the stage from the ref
          const stageToRecord = stageForNextCompletionCheckRef.current;
          console.log(`[CompletionCheck] New word completed: ${wordId} with stage ${stageToRecord}`);
          newlyCompletedWords.set(wordId, { stage: stageToRecord });
          // Add to just completed set
          justCompletedWords.add(wordId);
        }
      }
    }

    // Check all down words
    for (const number in puzzleData.down) {
      if (checkWordCorrectness('down', number)) {
        const wordId = `${number}-down`;
        // Preserve the existing stage if the word was already completed
        const existingData = completedWords.get(wordId);
        if (existingData) {
          // Word was already completed, keep its stage
          newlyCompletedWords.set(wordId, existingData);
        } else {
          // Word is newly completed, use the stage from the ref
          const stageToRecord = stageForNextCompletionCheckRef.current;
          console.log(`[CompletionCheck] New word completed: ${wordId} with stage ${stageToRecord}`);
          newlyCompletedWords.set(wordId, { stage: stageToRecord });
          // Add to just completed set
          justCompletedWords.add(wordId);
        }
      }
    }

    // Only update state if the map has actually changed to prevent infinite loops/unnecessary renders
    let mapChanged = newlyCompletedWords.size !== completedWords.size;
    
    if (!mapChanged) {
      // Check if any entries differ between the maps
      for (const [wordId, data] of newlyCompletedWords.entries()) {
        const existingData = completedWords.get(wordId);
        if (!existingData || existingData.stage !== data.stage) {
          mapChanged = true;
          break;
        }
      }
    }

    if (mapChanged) {
      console.log('[useEffect - CompletionCheck] Completed words map changed. Updating state.', newlyCompletedWords);
      
      // If we have just-completed words, implement two-phase commit
      if (justCompletedWords.size > 0) {
        // Create a snapshot to prevent stale closure issues
        const pendingIds = new Set(justCompletedWords); // freeze snapshot
        
        // ── Phase 1: expose slow duration ──
        setPendingCompletedWordIds(pendingIds);

        requestAnimationFrame(() => {
          // ── Phase 2: flip colour & kick off animation ──
          setCompletedWords(() => newlyCompletedWords);   // functional setter
          setRecentlyCompletedWordIds(pendingIds);        // use snapshot

          requestAnimationFrame(() => {
            setPendingCompletedWordIds(new Set());        // clear in next frame
          });
        });
        
        // Clear any existing timeout
        if (recentlyCompletedTimeoutRef.current) {
          clearTimeout(recentlyCompletedTimeoutRef.current);
        }
        
        // Simplified timeout calculation - no longer needs cascade factor
        const timeoutDelay = TRANSITION_DURATIONS.slow + 100;
        
        recentlyCompletedTimeoutRef.current = setTimeout(() => {
          setRecentlyCompletedWordIds(new Set());
          recentlyCompletedTimeoutRef.current = null;
        }, timeoutDelay);
      } else {
        // No just-completed words, simply update the map
        setCompletedWords(newlyCompletedWords);
      }
    }

    // Cleanup function to clear any pending timeouts on unmount or re-run
    return () => {
      if (recentlyCompletedTimeoutRef.current) {
        clearTimeout(recentlyCompletedTimeoutRef.current);
        recentlyCompletedTimeoutRef.current = null;
      }
      // Also clear the sets on cleanup - essential for robustness
      setRecentlyCompletedWordIds(new Set());
      setPendingCompletedWordIds(new Set());
    };

  // Dependencies: Run when gridData changes, or when puzzle/check function changes.
  // completedWords is included to properly compare inside the effect.
  }, [gridData, puzzleData, checkWordCorrectness, completedWords, setCompletedWords]);
  
  // Remove the separate cleanup effect since cleanup is now handled inside the main effect
  // useEffect(() => {
  //   return () => {
  //     if (recentlyCompletedTimeoutRef.current) {
  //       clearTimeout(recentlyCompletedTimeoutRef.current);
  //     }
  //     // Also clear the set on cleanup
  //     setRecentlyCompletedWordIds(new Set());
  //   };
  // }, []);

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
   * Handle guess input for a cell - Updated to accept currentStage parameter
   */
  const handleGuessInput = useCallback((row: number, col: number, char: string, currentStage: number = 0) => {
    // Store the current stage in the ref for the completion effect to use
    stageForNextCompletionCheckRef.current = currentStage;
    console.log(`[handleGuessInput] Input at (${row},${col}): "${char}" with stage ${currentStage}`);

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
   * Handle backspace key (clear current cell if it has a guess, otherwise move to previous and clear)
   */
  const handleBackspace = useCallback(() => {
    // console.log(`[handleBackspace] Called at (${selectedRow},${selectedCol})`); // Less noisy

    // Get current cell data to check if it has a guess
    const currentCell = getCellData(selectedRow, selectedCol);
    const hasGuess = !!(currentCell?.used && currentCell.guess);
    
    if (hasGuess) {
      // If current cell has content, check if it's editable
      const editable = isEditableCell(selectedRow, selectedCol);
      
      if (editable) {
        // Clear the current cell's guess without moving
        setGridData(produce(draft => {
          if (draft[selectedRow]?.[selectedCol]?.used) {
            // console.log(`[handleBackspace] Clearing cell (${selectedRow},${selectedCol})`); // Less noisy
            draft[selectedRow][selectedCol].guess = '';
          }
        }));
      } else {
        console.log(`[handleBackspace] Cell (${selectedRow},${selectedCol}) is locked. Deletion blocked.`);
      }
      
      // Return early - don't move to previous cell when current cell had content
      return;
    }
    
    // Iterative backward search for the first editable cell
    let prevRow = selectedRow;
    let prevCol = selectedCol;
    let foundEditableCell = false;
    let targetCellData: UsedCellData | null = null;
    
    // Keep moving backward until we find an editable cell or hit the boundary
    while (!foundEditableCell) {
      // Calculate the coordinates of the next cell backward
      if (currentDirection === 'across') {
        prevCol -= 1;
      } else {
        prevRow -= 1;
      }
      
      // Check if we're out of bounds
      if (prevRow < 0 || prevCol < 0 || 
          prevRow >= gridData.length || prevCol >= gridData[0].length) {
        // No more cells in this direction
        break;
      }
      
      // Get the cell data
      const cellData = getCellData(prevRow, prevCol);
      if (!cellData?.used) {
        // Skip unused cells
        continue;
      }
      
      // Check if this cell is editable
      if (isEditableCell(prevRow, prevCol)) {
        foundEditableCell = true;
        targetCellData = cellData as UsedCellData;
        break;
      }
    }
    
    // If we found an editable cell, update it and move there
    if (foundEditableCell && targetCellData) {
      // Clear the target cell's guess
      setGridData(produce(draft => {
        const cell = draft[prevRow]?.[prevCol];
        if (cell?.used) {
          // console.log(`[handleBackspace] Clearing previous cell (${prevRow},${prevCol})`); // Less noisy
          (cell as WritableDraft<UsedCellData>).guess = '';
        }
      }));
      
      // Determine direction and number for the target cell
      let newDirection = currentDirection;
      if (!targetCellData[currentDirection]) { // Auto-switch direction if needed
        const otherDir = otherDirection(currentDirection);
        if (targetCellData[otherDir]) {
          newDirection = otherDir;
        }
      }
      
      const newNumber = targetCellData[newDirection] ?? '';
      updateSelectionState(prevRow, prevCol, newDirection, newNumber);
    }

  }, [
    isEditableCell,
    selectedRow,
    selectedCol,
    currentDirection,
    setGridData,
    updateSelectionState,
    getCellData,
    gridData
    // calculateAndValidateTargetCell is no longer used
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
    completedWords, // Now returns a Map<string, CompletionData> instead of Set<string>
    selectedRow,
    selectedCol,
    currentDirection,
    currentNumber,
    isGameComplete, // Return game completion status
    recentlyCompletedWordIds,
    pendingCompletedWordIds, // Return new state
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