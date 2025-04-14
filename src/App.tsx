import { useGameStateManager } from './GameFlow/state/useGameStateManager'
import CrosswordProvider from './Crossword/components/CrosswordCore/CrosswordProvider'
import CrosswordGrid from './Crossword/components/CrosswordCore/CrosswordGrid'
import { ThemeProvider } from 'styled-components'
import { crosswordTheme } from './Crossword/styles/CrosswordStyles'
import { AppWrapper, Banner, CrosswordArea, ClueArea, KeyboardArea } from './Layout/components'
import { useState, useEffect, useCallback, useRef } from 'react' // Import useCallback
import { Direction, GridData, CellData, UsedCellData } from './Crossword/types' // Import necessary types
import { otherDirection } from './Crossword/components/CrosswordCore/util' // Import helper if needed

function App() {
  // Get initial state AND puzzle data
  // Note: useGameStateManager might evolve, ensure puzzleData is accessible
  const initialGameState = useGameStateManager();
  const puzzleData = initialGameState.puzzleData; // Keep a reference
  const gridDataRef = useRef<GridData | null>(null); // Ref to store computed grid data once

  // --- Harness State ---
  const [harnessRow, setHarnessRow] = useState(initialGameState.selectedRow);
  const [harnessCol, setHarnessCol] = useState(initialGameState.selectedCol);
  const [harnessDirection, setHarnessDirection] = useState<Direction>(initialGameState.currentDirection);
  const [harnessNumber, setHarnessNumber] = useState(initialGameState.currentNumber);


  // --- Helper to get cell data (mimics provider's internal logic) ---
  // This is simplified; a real implementation might be more robust
  // We compute the gridData once based on puzzleData for lookups
  useEffect(() => {
    if (puzzleData && !gridDataRef.current) {
      // Simplified grid creation logic for harness lookup
      // This is just for getting cell info (like across/down numbers)
      // You might need a more complete version if your helpers depend on the full structure
      const tempGrid: GridData = Array(15).fill(null).map((_, r) => // Assuming max 15x15 for now
         Array(15).fill(null).map((__, c) => ({ row: r, col: c, used: false }))
      );
      // Populate based on puzzleData (basic version)
      for (const dir of ['across', 'down'] as Direction[]) {
        for (const num in puzzleData[dir]) {
          const clue = puzzleData[dir][num];
          for (let i = 0; i < clue.answer.length; i++) {
            const r = clue.row + (dir === 'down' ? i : 0);
            const c = clue.col + (dir === 'across' ? i : 0);
            if (tempGrid[r]?.[c]) {
               tempGrid[r][c].used = true;
               (tempGrid[r][c] as UsedCellData)[dir] = num;
               if (i === 0) (tempGrid[r][c] as UsedCellData).number = num;
            }
          }
        }
      }
      gridDataRef.current = tempGrid;
      console.log("Harness Grid Data Computed for Lookups");
    }
  }, [puzzleData]);

  const getHarnessCellData = useCallback((row: number, col: number): CellData | undefined => {
     return gridDataRef.current?.[row]?.[col];
  }, []); // Depends only on the ref

  // --- Updated Harness Callbacks ---

  const handleHarnessCellSelect = useCallback((row: number, col: number) => {
    console.log('[Harness] Cell Select:', { row, col });
    const cellData = getHarnessCellData(row, col);

    if (!cellData?.used) return; // Ignore clicks on unused cells

    let newDirection = harnessDirection;
    // Basic direction toggle logic (like original provider):
    // If clicking the already selected cell, toggle direction if possible
    if (row === harnessRow && col === harnessCol) {
       const otherDir = otherDirection(harnessDirection);
       if (cellData[otherDir]) { // Check if the other direction is valid for this cell
          newDirection = otherDir;
       }
    } else {
       // If moving to a new cell, prefer the current direction if valid, else switch
       if (!cellData[harnessDirection]) {
          const otherDir = otherDirection(harnessDirection);
          if (cellData[otherDir]) {
             newDirection = otherDir;
          }
          // If neither direction is valid (shouldn't happen for used cell), keep current
       }
    }

    const newNumber = cellData[newDirection] ?? ''; // Get number for the final direction

    setHarnessRow(row);
    setHarnessCol(col);
    setHarnessDirection(newDirection);
    setHarnessNumber(newNumber);

  }, [getHarnessCellData, harnessRow, harnessCol, harnessDirection]); // Add dependencies

  const handleHarnessMoveRequest = useCallback((dRow: number, dCol: number) => {
    console.log('[Harness] Move Request:', { dRow, dCol });

    // Prefer direction based on movement axis
    let preferredDirection = harnessDirection;
    if (dRow !== 0 && dCol === 0) preferredDirection = 'down';
    else if (dCol !== 0 && dRow === 0) preferredDirection = 'across';

    // Simplified bounds check
    const targetRow = Math.max(0, harnessRow + dRow);
    const targetCol = Math.max(0, harnessCol + dCol);

    const targetCellData = getHarnessCellData(targetRow, targetCol);

    // If target is invalid or unused, don't move
    if (!targetCellData?.used) {
       console.log('[Harness] Move blocked - target unused/invalid');
       return;
    }

    // Determine final direction and number
    let newDirection = preferredDirection;
    if (!targetCellData[newDirection]) { // If preferred direction not valid for target
        const otherDir = otherDirection(newDirection);
        if (targetCellData[otherDir]) { // Try other direction
           newDirection = otherDir;
        } else { // If neither valid (black square?), don't change direction
           newDirection = harnessDirection; // Keep original direction (though number might be wrong)
           console.warn('[Harness] Move target has no valid direction? Keeping old direction.');
        }
    }

    const newNumber = targetCellData[newDirection] ?? '';

    setHarnessRow(targetRow);
    setHarnessCol(targetCol);
    setHarnessDirection(newDirection);
    setHarnessNumber(newNumber);

  }, [getHarnessCellData, harnessRow, harnessCol, harnessDirection]); // Add dependencies


  const handleHarnessDirectionToggleRequest = useCallback(() => {
    console.log('[Harness] Direction Toggle Request');
    const cellData = getHarnessCellData(harnessRow, harnessCol);

    if (!cellData?.used) return; // Cannot toggle if not on a used cell

    const newDirection = otherDirection(harnessDirection);
    const newNumber = cellData[newDirection]; // Get number for the *new* direction

    // Only toggle if the *new* direction is valid for the current cell
    if (newNumber) {
      setHarnessDirection(newDirection);
      setHarnessNumber(newNumber);
    } else {
      console.log('[Harness] Toggle blocked - other direction invalid for cell');
    }
  }, [getHarnessCellData, harnessRow, harnessCol, harnessDirection]); // Add dependencies


  const handleHarnessMoveToRequest = useCallback((row: number, col: number) => {
    console.log('[Harness] Move To Request:', { row, col });
    const cellData = getHarnessCellData(row, col);

    if (!cellData?.used) return; // Target must be valid

    // Try to preserve current direction if valid for the target cell
    let newDirection = harnessDirection;
    if (!cellData[newDirection]) {
       const otherDir = otherDirection(harnessDirection);
       if (cellData[otherDir]) {
          newDirection = otherDir;
       }
       // If neither valid, just keep original, number will clear below
    }

    const newNumber = cellData[newDirection] ?? '';

    setHarnessRow(row);
    setHarnessCol(col);
    setHarnessDirection(newDirection);
    setHarnessNumber(newNumber);

  }, [getHarnessCellData, harnessDirection]); // Add dependencies

  // --- Other handlers (mostly just logging for harness) ---
  const handleHarnessBackspaceRequest = () => {
    console.log('[Harness] Backspace Request');
    // Real logic later - for now, just log
  };

  const handleHarnessDeleteRequest = () => {
    console.log('[Harness] Delete Request');
     // Real logic later - for now, just log
  };

  const handleHarnessCharacterEnteredRequest = (row: number, col: number) => {
    console.log('[Harness] Character Entered:', { row, col });
     // Real logic later - for now, just log
  };

  // NOTE: onClueSelected is likely NOT called by the refactored provider
  // The provider's handleClueSelected now calls onMoveToRequest.
  // Keep this handler commented out or remove unless specifically needed.
  /*
  const handleHarnessClueSelected = (direction: Direction, number: string) => {
    console.log('[Harness] Clue Selected Callback:', { direction, number });
    // This callback might not be necessary if onMoveToRequest handles clue selection jumps
    // setHarnessDirection(direction);
    // setHarnessNumber(number);
    // Find row/col for clue start? -> Handled by onMoveToRequest now
  };
  */


  // Log harness state changes for testing
  useEffect(() => {
    console.log('[Harness] State Updated:', {
      harnessRow,
      harnessCol,
      harnessDirection,
      harnessNumber
    });
  }, [harnessRow, harnessCol, harnessDirection, harnessNumber]);

  // --- Render ---
  return (
    <AppWrapper>
      <Banner>Daily Crossword</Banner>
      <CrosswordArea>
        <ThemeProvider theme={crosswordTheme}>
          {/* Only render provider once puzzleData is loaded */}
          {puzzleData ? (
            <CrosswordProvider
              data={puzzleData} // Use the actual puzzle data
              useStorage={false}
              // Controlled state props
              selectedRow={harnessRow}
              selectedCol={harnessCol}
              currentDirection={harnessDirection}
              currentNumber={harnessNumber}
              // Callback handlers
              onCellSelect={handleHarnessCellSelect}
              onMoveRequest={handleHarnessMoveRequest}
              onDirectionToggleRequest={handleHarnessDirectionToggleRequest}
              onMoveToRequest={handleHarnessMoveToRequest}
              onBackspaceRequest={handleHarnessBackspaceRequest}
              onDeleteRequest={handleHarnessDeleteRequest}
              onCharacterEnteredRequest={handleHarnessCharacterEnteredRequest}
              // onClueSelected={handleHarnessClueSelected} // Likely remove/comment out
            >
              <CrosswordGrid />
            </CrosswordProvider>
          ) : (
             <div>Loading puzzle...</div> // Placeholder while loading
          )}
        </ThemeProvider>
      </CrosswordArea>
      <ClueArea>Current Clue Placeholder</ClueArea>
      <KeyboardArea>Keyboard Placeholder</KeyboardArea>
    </AppWrapper>
  )
}

export default App