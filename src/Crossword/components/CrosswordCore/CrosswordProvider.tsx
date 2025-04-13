/* eslint-disable no-console */

import React, {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import { produce } from 'immer';
import { ThemeContext, ThemeProvider, DefaultTheme } from 'styled-components';

import { CrosswordContext, CrosswordContextType } from './context';
import {
  AnswerTuple,
  CluesData,
  CluesInput,
  cluesInputShapeOriginal,
  Direction,
  EnhancedProps,
  FocusHandler,
  GridPosition,
  GridData,
  UsedCellData,
  CellData,
  UnusedCellData,
  ClueTypeOriginal, // Import ClueTypeOriginal
} from '../../types'; // Assuming types are in ../../types/index.ts
import { CrosswordTheme } from '../../types/theme';
import {
  bothDirections,
  clearGuesses,
  createGridData,
  isAcross,
  loadGuesses,
  otherDirection, // Keep otherDirection if needed by consumers via context? No, looks like internal use only which is removed. Okay to remove if truly unused later.
  saveGuesses,
} from './util';

const defaultStorageKey = 'guesses';

// Helper Type for items within the CluesData structure
type ClueDataItem = ClueTypeOriginal & {
  number: string;
  complete?: boolean;
  correct?: boolean;
};

// Step 2.2.1: Add PropTypes for new props
export const crosswordProviderPropTypes = {
  /**

clue/answer data; see <a

href="#/Configuration%20and%20customization/Clue%20input%20format">Clue

input format</a> for details.
*/
  data: cluesInputShapeOriginal.isRequired,

  /** whether to use browser storage to persist the player's work-in-progress */
  useStorage: PropTypes.bool,

  /**

a custom storage key to use for persistence; defaults to "guesses" when not

provided
*/
  storageKey: PropTypes.string,

  /**

callback function that fires when a player completes an answer, whether

correct or not; called with (direction, number, correct, answer)

arguments, where direction is 'across' or 'down', number is the

clue number as text (like '1'), correct is whether the guessed answer

is correct and answer is the (actual and correct) answer itself

@since 4.3.0
*/
  onAnswerComplete: PropTypes.func,

  /**

callback function that fires when a player answers a clue correctly; called

with (direction, number, answer) arguments, where direction is

'across' or 'down', number is the clue number as text (like '1'),

and answer is the answer itself

@since 4.3.0; replacing onCorrect (to reduce ambiguity)
*/
  onAnswerCorrect: PropTypes.func,

  /**

callback function that fires when a player answers a clue correctly;

called with (direction, number, answer) arguments, where direction is

'across' or 'down', number is the clue number as text (like '1'),

and answer is the answer itself

@deprecated 4.3.0; being replaced by onAnswerCorrect (to reduce

ambiguity)
*/
  onCorrect: PropTypes.func,

  /**

callback function that fires when a player answers a clue incorrectly;

called with (direction, number, answer) arguments, where direction is

'across' or 'down', number is the clue number as text (like '1'),

and answer is the (actual and correct) answer itself

@since 4.3.0
*/
  onAnswerIncorrect: PropTypes.func,

  /**

callback function that's called when a crossword is loaded, to batch up

correct answers loaded from storage; passed an array of the same values

that onCorrect would recieve
*/
  onLoadedCorrect: PropTypes.func,

  /**

callback function that's called when the overall crossword is complete,

whether correct or not; called with (correct) argument, a boolean which

indicates whether the crossword is correct or not.
*/
  onCrosswordComplete: PropTypes.func,

  /**

callback function that's called when the overall crossword is completely

correct (or not)

NOTE: this will be deprecated for onCrosswordComplete in the future.
*/
  onCrosswordCorrect: PropTypes.func,

  /**

callback function called when a cell changes (e.g. when the user types a

letter); called with (row, col, char) arguments, where the row and

column are the 0-based position of the cell, and char is the character

typed (already massaged into upper-case)
*/
  onCellChange: PropTypes.func,

  /**

callback function called when a clue is selected
*/
  onClueSelected: PropTypes.func,

  /**

ADDED: callback function called when a cell is selected
*/
  onCellSelect: PropTypes.func, // Keep this (was already added)

  children: PropTypes.node,

  // NEW Props (PropTypes) from Step 2.2.1
  /** The currently selected row (controlled). */
  selectedRow: PropTypes.number.isRequired,
  /** The currently selected column (controlled). */
  selectedCol: PropTypes.number.isRequired,
  /** The currently selected direction (controlled). */
  currentDirection: PropTypes.oneOf(['across', 'down']).isRequired,
  /** The currently selected clue number (controlled). */
  currentNumber: PropTypes.string.isRequired,

  /** Callback requesting a relative move. */
  onMoveRequest: PropTypes.func,
  /** Callback requesting a direction toggle. */
  onDirectionToggleRequest: PropTypes.func,
  /** Callback requesting a move to a specific cell. */
  onMoveToRequest: PropTypes.func,
  /** Callback requesting backspace behavior (delete char + move backward). */
  onBackspaceRequest: PropTypes.func,
  /** Callback requesting delete behavior (delete char, no move). */
  onDeleteRequest: PropTypes.func,
  /** Callback triggered after a character has been entered successfully. */
  onCharacterEnteredRequest: PropTypes.func,
};

export type CrosswordProviderProps = EnhancedProps<
  typeof crosswordProviderPropTypes,
  {
    /**
     * clue/answer data; see <a
     * href="#/Configuration%20and%20customization/Clue%20input%20format">Clue
     * input format</a> for details.
     */
    data: CluesInput;

    /**
     * Whether to use browser storage to persist the player's work-in-progress.
     * Default parameter handles the default value.
     */
    useStorage?: boolean;

    /**
     * A custom storage key to use for persistence; defaults to "guesses" when not
     * provided.
     */
    storageKey?: string;

    /**
     * ADDED: Set of completed word IDs (e.g., "1-across") to block input.
     */
    completedWordIds?: Set<string>;

    /**
     * ADDED: callback function called when a cell is selected
     */
    onCellSelect: (row: number, col: number) => void; // Keep required as per original plan/code

    /**
     * callback function that fires when a player completes an answer, whether
     * correct or not; called with `(direction, number, correct, answer)`
     * arguments, where `direction` is `'across'` or `'down'`, `number` is the
     * clue number as text (like `'1'`), `correct` is whether the guessed answer
     * is correct and `answer` is the (actual and correct) answer itself
     *
     * @since 4.3.0
     */
    onAnswerComplete?: (
      direction: Direction,
      number: string,
      correct: boolean,
      answer: string
    ) => void;

    /**
     * callback function that fires when a player answers a clue correctly;
     * called with `(direction, number, answer)` arguments, where `direction` is
     * `'across'` or `'down'`, `number` is the clue number as text (like `'1'`),
     * and `answer` is the answer itself
     *
     * @since 4.3.0; replacing `onCorrect` (to reduce ambiguity)
     */
    onAnswerCorrect?: (
      direction: Direction,
      number: string,
      answer: string
    ) => void;

    /**
     * callback function that fires when a player answers a clue correctly;
     * called with `(direction, number, answer)` arguments, where `direction` is
     * `'across'` or `'down'`, `number` is the clue number as text (like `'1'`),
     * and `answer` is the answer itself
     *
     * NOTE: this is the original/previous name for what is now being called
     * `onAnswerCorrect` (to reduce ambiguity).  It will be deprecated in the
     * future.
     */
    onCorrect?: (direction: Direction, number: string, answer: string) => void;

    /**
     * callback function that fires when a player answers a clue *in*correctly;
     * called with `(direction, number, answer)` arguments, where `direction` is
     * `'across'` or `'down'`, `number` is the clue number as text (like `'1'`),
     * and `answer` is the (actual and correct) answer itself
     *
     * @since 4.3.0
     */
    onAnswerIncorrect?: (
      direction: Direction,
      number: string,
      answer: string
    ) => void;

    /**
     * callback function that's called when a crossword is loaded, to batch up
     * correct answers loaded from storage; passed an array of the same values
     * that `onCorrect` would recieve
     */
    onLoadedCorrect?: (loaded: AnswerTuple[]) => void;

    /**
     * callback function that's called when the overall crossword is complete,
     * whether correct or not; called with `(correct)` argument, a boolean which
     * indicates whether the crossword is correct or not.
     */
    onCrosswordComplete?: (correct: boolean) => void;

    /**
     * callback function that's called when the overall crossword is completely
     * correct (or not)
     *
     * NOTE: this will be deprecated for `onCrosswordComplete` in the future.
     */
    onCrosswordCorrect?: (isCorrect: boolean) => void;

    /**
     * callback function called when a cell changes (e.g. when the user types a
     * letter); called with `(row, col, char)` arguments, where the `row` and
     * `column` are the 0-based position of the cell, and `char` is the character
     * typed (already massaged into upper-case)
     */
    onCellChange?: (row: number, col: number, char: string) => void;

    /**
     * callback function called when a clue is selected
     */
    onClueSelected?: (direction: Direction, number: string) => void;

    /**
     * React children expected to be rendered within the provider.
     */
    children?: React.ReactNode;

    // NEW Props (TypeScript) from Step 2.2.1
    /** The currently selected row (controlled by parent). */
    selectedRow: number;
    /** The currently selected column (controlled by parent). */
    selectedCol: number;
    /** The currently selected direction (controlled by parent). */
    currentDirection: Direction;
    /** The currently selected clue number (controlled by parent). */
    currentNumber: string;

    /** Callback handler requesting a relative move (e.g., Arrow Keys). */
    onMoveRequest?: (dRow: number, dCol: number) => void;
    /** Callback handler requesting a direction toggle (e.g., Space or Click). */
    onDirectionToggleRequest?: () => void;
    /** Callback handler requesting a move to a specific cell (e.g., Home/End or Clue Click). */
    onMoveToRequest?: (row: number, col: number) => void;
    /** Callback handler requesting backspace behavior. */
    onBackspaceRequest?: () => void;
    /** Callback handler requesting delete behavior. */
    onDeleteRequest?: () => void;
    /** Callback handler triggered after a character has been successfully entered. */
    onCharacterEnteredRequest?: (row: number, col: number) => void;
  }
>;

export interface CrosswordProviderImperative {
  /**

Sets focus to the crossword component.
*/
  focus: () => void;

  /**

Resets the entire crossword; clearing all answers in the grid and

also any persisted data.
*/
  reset: () => void;

  /**

Fills all the answers in the grid and calls the onLoadedCorrect

callback with every answer.
*/
  fillAllAnswers: () => void;

  /**

Returns whether the crossword is entirely correct or not.
*/
  isCrosswordCorrect: () => boolean;

  /**

Sets the "guess" character for a specific grid position.

@since 4.1.0
*/
  setGuess: (row: number, col: number, guess: string) => void;
}

/**

The fundamental logic and data management component for react-crossword.

@since 4.0
*/
const CrosswordProvider = React.forwardRef<
  CrosswordProviderImperative,
  CrosswordProviderProps
>(
  (
    {
      // Existing Props
      data,
      onAnswerComplete,
      onAnswerCorrect,
      onCorrect,
      onAnswerIncorrect,
      onLoadedCorrect,
      onCrosswordComplete,
      onCrosswordCorrect,
      onCellChange,
      onClueSelected,
      onCellSelect, // Already existed
      completedWordIds, // Already existed
      useStorage = true,
      storageKey,
      children,

      // NEW Props (Destructuring) from Step 2.2.1
      selectedRow = 0, // Default for robustness
      selectedCol = 0, // Default for robustness
      currentDirection = 'across', // Default for robustness
      currentNumber = '', // Default for robustness (might be better based on first clue?)
      onMoveRequest,
      onDirectionToggleRequest,
      onMoveToRequest,
      onBackspaceRequest,
      onDeleteRequest,
      onCharacterEnteredRequest,
    },
    ref
  ) => {
    // Use the ThemeContext directly
    const contextTheme = useContext(ThemeContext);

    // Use context theme directly, only cleaning null values if needed
    const finalTheme = useMemo<DefaultTheme>(
      () => {
        // Clean any null values, replacing them with undefined
        // for compatibility with DefaultTheme (which expects string | undefined)
        return Object.fromEntries(
          Object.entries(contextTheme || {}).map(([key, value]) => [
            key,
            value === null ? undefined : value,
          ])
        ) as DefaultTheme;
      },
      [contextTheme]
    );

    const {
      rows,
      cols,
      gridData: masterGridData,
      clues: masterClues,
    } = useMemo(
      () => createGridData(data, finalTheme.allowNonSquare ?? false),
      [data, finalTheme.allowNonSquare]
    );

    const [gridData, setGridData] = useState<GridData>([]);
    const [clues, setClues] = useState<CluesData | undefined>();

    const registeredFocusHandler = useRef<FocusHandler | null>(null);

    // interactive player state
    const [focused, setFocused] = useState(false);

    // Step 2.2.2: Remove Internal State for Focus/Selection
    // const [focusedRow, setFocusedRow] = useState(0); // REMOVED
    // const [focusedCol, setFocusedCol] = useState(0); // REMOVED
    // const [currentDirection, setCurrentDirection] = useState<Direction>('across'); // REMOVED
    // const [currentNumber, setCurrentNumber] = useState('1'); // REMOVED

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [bulkChange, setBulkChange] = useState<string | null>(null); // Keep bulk change state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [checkQueue, setCheckQueue] = useState<GridPosition[]>([]); // Keep check queue state

    const getCellData = useCallback(
      (row: number, col: number): CellData => {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          if (gridData && gridData[row] && gridData[row][col]) {
            return gridData[row][col];
          }
        }
        return { row, col, used: false, outOfBounds: true } as GridPosition &
          UnusedCellData;
      },
      [cols, gridData, rows] // Dependency array OK
    );

    const isCellEditable = useCallback(
      (row: number, col: number): boolean => {
        const cell = getCellData(row, col);
        if (!cell.used) return false;

        const acrossNum = cell.across;
        const downNum = cell.down;

        if (acrossNum && completedWordIds?.has(`${acrossNum}-across`)) {
          return false;
        }
        if (downNum && completedWordIds?.has(`${downNum}-down`)) {
          return false;
        }

        return true;
      },
      [getCellData, completedWordIds] // Dependency array OK
    );

    const setCellCharacter = useCallback(
      (row: number, col: number, char: string) => {
        const cell = getCellData(row, col);

        if (!cell.used || !isCellEditable(row, col)) {
          return;
        }

        if (cell.guess === char) {
          return;
        }

        setGridData(
          produce((draft: GridData) => {
            if (draft && draft[row] && draft[row][col]) {
              (draft[row][col] as UsedCellData).guess = char;
            }
          })
        );

        setCheckQueue(
          produce((draft: Array<{ row: number; col: number }>) => {
            draft.push({ row, col });
          })
        );

        if (onCellChange) {
          onCellChange(row, col, char);
        }
      },
      [getCellData, isCellEditable, onCellChange, setGridData, setCheckQueue] // Dependency array OK
    );

    const notifyAnswerComplete = useCallback(
      (
        direction: Direction,
        number: string,
        correct: boolean,
        answer: string
      ) => {
        if (onAnswerComplete) {
          onAnswerComplete(direction, number, correct, answer);
        }

        if (correct) {
          if (onAnswerCorrect) {
            onAnswerCorrect(direction, number, answer);
          }
          if (onCorrect) {
            onCorrect(direction, number, answer);
          }
        } else if (onAnswerIncorrect) {
          onAnswerIncorrect(direction, number, answer);
        }
      },
      [onAnswerComplete, onAnswerCorrect, onAnswerIncorrect, onCorrect] // Dependency array OK
    );

    const checkCorrectness = useCallback(
      (row: number, col: number) => {
        const cell = getCellData(row, col);
        if (!cell.used) {
          throw new Error('unexpected unused cell');
        }

        bothDirections.forEach((direction: Direction) => {
          const across = isAcross(direction);
          const number = cell[direction];
          if (!number) {
            return;
          }

          if (!data || !data[direction] || !data[direction][number]) {
            console.error(`Missing clue data for ${number}-${direction}`);
            return;
          }

          const info = data[direction][number];

          let complete = true;
          let correct = true;

          for (let i = 0; i < info.answer.length; i++) {
            const checkCell = getCellData(
              info.row + (across ? 0 : i),
              info.col + (across ? i : 0)
            );

            if (!checkCell.used || !checkCell.guess) {
              complete = false;
              correct = false;
              break;
            }

            if (checkCell.guess !== checkCell.answer) {
              correct = false;
            }
          }

          setClues(
            produce((draft: CluesData | undefined) => {
              if (draft) {
                const clueInfo = draft[direction]?.find(
                  (i: ClueDataItem) => i.number === number
                );
                if (clueInfo) {
                  clueInfo.complete = complete;
                  clueInfo.correct = correct;
                }
              }
            })
          );

          if (complete) {
            notifyAnswerComplete(direction, number, correct, info.answer);
          }
        });
      },
      [data, getCellData, notifyAnswerComplete, setClues] // Added setClues dependency
    );

    // useEffect for checkQueue - OK
    useEffect(() => {
      if (checkQueue.length === 0) {
        return;
      }
      checkQueue.forEach(({ row, col }: { row: number; col: number }) =>
        checkCorrectness(row, col)
      );
      setCheckQueue([]);
    }, [checkQueue, checkCorrectness]);

    // useMemo for crosswordComplete/Correct - OK
    const { crosswordComplete, crosswordCorrect } = useMemo(() => {
      const complete = !!(
        clues &&
        bothDirections.every((direction: Direction) =>
          clues[direction]?.every((clueInfo: ClueDataItem) => clueInfo.complete)
        )
      );

      const correct =
        complete &&
        !!(
          clues &&
          bothDirections.every((direction: Direction) =>
            clues[direction]?.every((clueInfo: ClueDataItem) => clueInfo.correct)
          )
        );

      return { crosswordComplete: complete, crosswordCorrect: correct };
    }, [clues]);

    // useEffect for crossword completion callbacks - OK
    useEffect(() => {
      if (crosswordComplete) {
        if (onCrosswordComplete) {
          onCrosswordComplete(crosswordCorrect);
        }
        if (onCrosswordCorrect) {
          onCrosswordCorrect(crosswordCorrect);
        }
      }
    }, [
      crosswordComplete,
      crosswordCorrect,
      onCrosswordComplete,
      onCrosswordCorrect,
    ]);

    // focus management - OK
    const focus = useCallback(() => {
      if (registeredFocusHandler.current) {
        registeredFocusHandler.current();
        setFocused(true);
      } else {
        console.warn(
          'CrosswordProvider: focus() has no registered handler to call!'
        );
      }
    }, [setFocused]); // setFocused is stable

    // Step 2.2.8: Remove Unused Internal Code: Movement functions
    // const moveTo = useCallback(...); // REMOVED
    // const moveRelative = useCallback(...); // REMOVED
    // const moveForward = useCallback(...); // REMOVED
    // const moveBackward = useCallback(...); // REMOVED

    // Step 2.2.6: Refactor `handleSingleCharacter`
    const handleSingleCharacter = useCallback(
      (char: string) => {
        // Use props selectedRow/selectedCol
        if (!isCellEditable(selectedRow, selectedCol)) {
          // Parent decides if focus should move even if not editable
          // We might still want to notify the parent?
          // For now, just return as per plan's interpretation.
          return;
        }

        // Set the character using props selectedRow/selectedCol
        setCellCharacter(selectedRow, selectedCol, char.toUpperCase());

        // Remove moveForward();

        // Add call to the new callback prop using props selectedRow/selectedCol
        onCharacterEnteredRequest?.(selectedRow, selectedCol);
      },
      // Update dependency array (Step 2.2.6 & 2.2.9)
      [
        selectedRow,
        selectedCol,
        isCellEditable,
        setCellCharacter,
        onCharacterEnteredRequest,
      ]
    );

    // Step 2.2.5: Refactor `handleInputKeyDown`
    const handleInputKeyDown = useCallback<
      React.KeyboardEventHandler<HTMLInputElement>
    >(
      (event) => {
        if (event.ctrlKey || event.altKey || event.metaKey) {
          return;
        }

        let preventDefault = true;
        const { key } = event;

        switch (key) {
          case 'ArrowUp':
            // Replace moveRelative with onMoveRequest
            onMoveRequest?.(-1, 0);
            break;

          case 'ArrowDown':
            // Replace moveRelative with onMoveRequest
            onMoveRequest?.(1, 0);
            break;

          case 'ArrowLeft':
            // Replace moveRelative with onMoveRequest
            onMoveRequest?.(0, -1);
            break;

          case 'ArrowRight':
            // Replace moveRelative with onMoveRequest
            onMoveRequest?.(0, 1);
            break;

          case ' ': // treat space like tab?
          case 'Tab': {
            // Replace internal direction toggle with onDirectionToggleRequest
            onDirectionToggleRequest?.();
            // Keep prevent default logic (especially for Space)
             if (key === ' ') {
                preventDefault = true;
             } else {
                // Only prevent default for Tab if the toggle *might* have occurred
                // This is tricky without knowing if the toggle was valid.
                // Let's preventDefault for Tab always for simplicity now, parent can refine.
                preventDefault = true;
             }
            break;
          }

          case 'Backspace':
          case 'Delete': {
            // Use props selectedRow/selectedCol
            if (isCellEditable(selectedRow, selectedCol)) {
              setCellCharacter(selectedRow, selectedCol, '');
            }
            if (key === 'Backspace') {
              // Replace moveBackward with onBackspaceRequest
              onBackspaceRequest?.();
            } else { // Delete key
              // Add onDeleteRequest
              onDeleteRequest?.();
            }
            break;
          }

          case 'Home':
          case 'End': {
            // Use props currentDirection/currentNumber
            if (!data || !data[currentDirection] || !data[currentDirection][currentNumber]) break;
            const info = data[currentDirection][currentNumber];
            if (!info) break;

            const { answer: { length } } = info;
            let { row, col } = info;

            if (key === 'End') {
              const across = isAcross(currentDirection);
              if (across) {
                col += length - 1;
              } else {
                row += length - 1;
              }
            }

            // Replace moveTo with onMoveToRequest
            onMoveToRequest?.(row, col);
            break;
          }

          default:
            if (key.length !== 1 || !/^[a-zA-Z]$/.test(key)) {
              preventDefault = false;
              break;
            }
            // Keep call to handleSingleCharacter (which is now refactored)
            handleSingleCharacter(key);
            break;
        }

        if (preventDefault) {
          event.preventDefault();
        }
      },
      // Update dependency array (Step 2.2.5 & 2.2.9)
      [
        handleSingleCharacter, // Refactored version
        currentDirection, // Prop
        getCellData,
        selectedRow, // Prop
        selectedCol, // Prop
        isCellEditable,
        setCellCharacter,
        data,
        currentNumber, // Prop
        onMoveRequest, // New callback prop
        onDirectionToggleRequest, // New callback prop
        onBackspaceRequest, // New callback prop
        onDeleteRequest, // New callback prop
        onMoveToRequest, // New callback prop
      ]
    );

    // handleInputChange and related useEffect - OK (no changes needed based on plan)
    const handleInputChange = useCallback<
      React.ChangeEventHandler<HTMLInputElement>
    >((event) => {
      event.preventDefault();
      setBulkChange(event.target.value);
    }, [setBulkChange]); // setBulkChange is stable

    useEffect(() => {
      if (!bulkChange) {
        return;
      }
      // Uses refactored handleSingleCharacter
      handleSingleCharacter(bulkChange[0]);
      setBulkChange(bulkChange.length === 1 ? null : bulkChange.substring(1));
    }, [bulkChange, handleSingleCharacter]);

    // Step 2.2.8: Remove Unused Internal Code: Initial focus useEffect
    // useEffect(() => { ... }, [masterClues, masterGridData, storageKey, useStorage]); // REMOVED

    // useEffect for loading/initializing gridData/clues - Keep this, but remove initial focus logic
    useEffect(() => {
      if (!masterGridData) return;

      const newGridData = masterGridData.map((row: CellData[]) =>
        row.map((cell: CellData) => ({ ...cell }))
      );

      const newCluesData: CluesData = {
        across: masterClues.across.map((clue: ClueDataItem) => ({ ...clue })),
        down: masterClues.down.map((clue: ClueDataItem) => ({ ...clue })),
      };

      if (useStorage) {
        loadGuesses(newGridData, storageKey || defaultStorageKey);
      }

      setClues(newCluesData);
      setGridData(newGridData);

      // Trigger correctness check after loading from storage
      if (useStorage) {
        // Need to check all cells potentially affected by loaded guesses
        // A simple approach is to check one cell from each loaded clue
        // Or check all cells that have a guess loaded.
        const cellsToCheck: GridPosition[] = [];
         newGridData.forEach((row, r) => {
            row.forEach((cell, c) => {
              if (cell.used && cell.guess) {
                 cellsToCheck.push({ row: r, col: c });
              }
            });
         });
        // console.log("Cells to check after load:", cellsToCheck.length);
        setCheckQueue(produce((draft) => [...cellsToCheck])); // Replace queue
      }

      // REMOVED Initial focus setting logic (was here previously)
      // Parent component is now responsible for setting initial selectedRow/Col/Direction/Number

    }, [masterClues, masterGridData, storageKey, useStorage, setClues, setGridData, setCheckQueue]); // Added setClues, setGridData, setCheckQueue

    // useEffect for saving guesses - OK
    useEffect(() => {
      if (!gridData || gridData.length === 0 || !useStorage) {
        return;
      }
      saveGuesses(gridData, storageKey || defaultStorageKey);
    }, [gridData, storageKey, useStorage]);

    // Step 2.2.4: Refactor `handleCellClick`
    const handleCellClick = useCallback(
      (cellData: CellData) => {
        if (cellData.used) {
          const { row, col } = cellData;

          // Call the upstream handler only
          onCellSelect?.(row, col);

          // REMOVED internal logic for direction switching, state updates, and focus calls
        }
      },
      // Update dependency array (Step 2.2.4 & 2.2.9)
      [onCellSelect, getCellData] // Only need onCellSelect and getCellData (to check cellData.used)
    );

    // Step 2.2.7: Refactor `handleInputClick`
    const handleInputClick = useCallback<
      React.MouseEventHandler<HTMLInputElement>
    >(
      (event) => {
        // Simply signal the intent to toggle direction.
        onDirectionToggleRequest?.();
      },
      // Update dependency array (Step 2.2.7 & 2.2.9)
      [onDirectionToggleRequest]
    );

    // Step 2.2.7: Refactor `handleClueSelected`
    const handleClueSelected = useCallback(
      (direction: Direction, number: string) => {
        const info = clues?.[direction]?.find(
          (clue: ClueDataItem) => clue.number === number
        );

        if (!info) {
          return;
        }

        // Replace moveTo with onMoveToRequest
        onMoveToRequest?.(info.row, info.col);

        // REMOVED focus call

        // Keep original notification
        if (onClueSelected) {
          onClueSelected(direction, number);
        }
      },
      // Update dependency array (Step 2.2.7 & 2.2.9)
      [clues, onClueSelected, onMoveToRequest]
    );

    // registerFocusHandler - OK
    const registerFocusHandler = useCallback(
      (focusHandler: FocusHandler | null) => {
        registeredFocusHandler.current = focusHandler;
      },
      [] // No dependencies
    );

    // imperative commands...
    useImperativeHandle(
      ref,
      () => ({
        focus, // Keep focus command
        reset: () => {
          setGridData(
            produce((draft: GridData) => {
              draft.forEach((rowData: CellData[]) => {
                rowData.forEach((cellData: CellData) => {
                  if (cellData.used) {
                    (cellData as UsedCellData).guess = '';
                  }
                });
              });
            })
          );

          setClues(
            produce((draft: CluesData | undefined) => {
              bothDirections.forEach((direction: Direction) => {
                draft?.[direction]?.forEach((clueInfo: ClueDataItem) => {
                  delete clueInfo.complete;
                  delete clueInfo.correct;
                });
              });
            })
          );

          if (useStorage) {
            clearGuesses(storageKey || defaultStorageKey);
          }
          // Parent should reset selection state if needed after calling reset
        },
        fillAllAnswers: () => {
          setGridData(
            produce((draft: GridData) => {
              draft.forEach((rowData: CellData[]) => {
                rowData.forEach((cellData: CellData) => {
                  if (cellData.used) {
                    (cellData as UsedCellData).guess = (
                      cellData as UsedCellData
                    ).answer;
                  }
                });
              });
            })
          );

          setClues(
            produce((draft: CluesData | undefined) => {
              bothDirections.forEach((direction: Direction) => {
                draft?.[direction]?.forEach((clueInfo: ClueDataItem) => {
                  clueInfo.complete = true;
                  clueInfo.correct = true;
                });
              });
            })
          );

          // Trigger correctness check after fill
           const cellsToCheck: GridPosition[] = [];
           gridData.forEach((row, r) => { // Use current gridData state before produce finishes? Or masterGridData? Let's use masterGridData as reference shape
               masterGridData.forEach((masterRow, r) => {
                 masterRow.forEach((cell, c) => {
                     if (cell.used) {
                         cellsToCheck.push({ row: r, col: c });
                     }
                 });
               });
           });
           setCheckQueue(produce((draft) => [...cellsToCheck])); // Replace queue


          if (onLoadedCorrect) {
            const loadedCorrect: AnswerTuple[] = [];
            bothDirections.forEach((direction: Direction) => {
              // Use masterClues as the source of truth for answers
              masterClues[direction]?.forEach(({ number, answer }) => {
                loadedCorrect.push([direction, number, answer]);
              });
            });
            onLoadedCorrect(loadedCorrect);
          }
        },
        isCrosswordCorrect: () => crosswordCorrect, // Keep accessor
        setGuess: (row: number, col: number, guess: string) => {
           // Keep imperative guess setting, respecting editability
           if (isCellEditable(row, col)) {
             setCellCharacter(row, col, guess.toUpperCase());
           }
        },
      }),
      // Update dependency array (Step 2.2.9)
      [
        crosswordCorrect,
        focus,
        onLoadedCorrect,
        isCellEditable,
        setCellCharacter,
        storageKey,
        useStorage,
        setGridData, // Added
        setClues, // Added
        setCheckQueue, // Added for fillAllAnswers check trigger
        masterGridData, // Added for fillAllAnswers cell iteration
        masterClues, // Added for fillAllAnswers callback data
      ]
    );

    // Step 2.2.3: Modify Context Population (useMemo)
    const crosswordContext = useMemo<CrosswordContextType>(
      () => ({
        // Grid data
        rows,
        cols,
        gridData,
        clues,

        // Interaction Handlers (consumers use these via context)
        handleInputKeyDown, // Now calls external callbacks
        handleInputChange, // Unchanged
        handleCellClick, // Now calls external onCellSelect
        handleInputClick, // Now calls external onDirectionToggleRequest
        handleClueSelected, // Now calls external onMoveToRequest & onClueSelected
        registerFocusHandler,
        handleSingleCharacter, // Now calls external onCharacterEnteredRequest

        // State tükrözése a props-ból
        focused, // Internal focus state of the hidden input
        selectedPosition: { row: selectedRow, col: selectedCol }, // Use props
        selectedDirection: currentDirection, // Use prop
        selectedNumber: currentNumber, // Use prop

        // Derived state
        crosswordCorrect,
      }),
      // Update dependency array (Step 2.2.3 & 2.2.9)
      [
        rows, cols, gridData, clues,
        handleInputKeyDown, handleInputChange, handleCellClick, handleInputClick, handleClueSelected, registerFocusHandler, handleSingleCharacter, // Callbacks should be stable
        focused, // Internal state
        selectedRow, selectedCol, currentDirection, currentNumber, // Props reflecting external state
        crosswordCorrect, // Derived state
      ]
    );

    return (
      <ThemeProvider theme={finalTheme}>
        <CrosswordContext.Provider value={crosswordContext}>
          {children}
        </CrosswordContext.Provider>
      </ThemeProvider>
    );
  }
);

export default CrosswordProvider;

CrosswordProvider.displayName = 'CrosswordProvider';
CrosswordProvider.propTypes = crosswordProviderPropTypes;

// defaultProps removed previously, still removed.