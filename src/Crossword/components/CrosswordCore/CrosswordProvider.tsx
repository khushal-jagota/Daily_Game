/* eslint-disable no-console */

import React, {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState, // Keep useState for clues, focused, bulkChange, checkQueue
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
  GridData, // Keep GridData type
  UsedCellData,
  CellData,
  UnusedCellData,
  ClueTypeOriginal, // Import ClueTypeOriginal
} from '../../types'; // Assuming types are in ../../types/index.ts
import {
  bothDirections,
  clearGuesses,
  createGridData,
  isAcross,
  loadGuesses,
  otherDirection,
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

  /** Callback for attempting to enter a guess at a cell position. */
  onGuessAttempt: PropTypes.func,

  /** The current grid data containing player guesses. */
  gridData: PropTypes.array.isRequired,
  
  /** Map of cell completion status for visual feedback. */
  cellCompletionStatus: PropTypes.instanceOf(Map),
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

    /** Callback for attempting to enter a guess at a cell position. */
    onGuessAttempt?: (row: number, col: number, char: string) => void;

    /** The current grid data containing player guesses. */
    gridData: GridData;
    
    /** Map of cell completion status for visual feedback. */
    cellCompletionStatus?: Map<string, { completed: boolean; stage: number }>;
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
      onGuessAttempt,
      gridData,
      cellCompletionStatus,
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

    // DELETED: const [gridData, setGridData] = useState<GridData>([]);

    const [clues, setClues] = useState<CluesData | undefined>(); // Keep clues state
    const registeredFocusHandler = useRef<FocusHandler | null>(null); // Keep focus handler ref

    // interactive player state
    const [focused, setFocused] = useState(false); // Keep internal focused state

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [bulkChange, setBulkChange] = useState<string | null>(null); // Keep bulk change state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [checkQueue, setCheckQueue] = useState<GridPosition[]>([]); // Keep check queue state

    // Update getCellData to use gridData prop
    const getCellData = useCallback(
      (row: number, col: number): CellData => {
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          // Reads from gridData prop now
          if (gridData && gridData[row] && gridData[row][col]) {
            return gridData[row][col];
          }
        }
        return { row, col, used: false, outOfBounds: true } as GridPosition &
          UnusedCellData;
      },
      [cols, gridData, rows] // Depends on gridData prop
    );

    // DELETED: isCellEditable useCallback block

    // DELETED: setCellCharacter useCallback block

    // Keep notifyAnswerComplete
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

    // Keep checkCorrectness - uses getCellData (which now reads prop)
    const checkCorrectness = useCallback(
      (row: number, col: number) => {
        const cell = getCellData(row, col); // Uses updated getCellData
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
            const checkCell = getCellData( // Uses updated getCellData
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
      [data, getCellData, notifyAnswerComplete, setClues] // Depends on updated getCellData
    );

    // Keep useEffect for checkQueue
    useEffect(() => {
      if (checkQueue.length === 0) {
        return;
      }
      checkQueue.forEach(({ row, col }: { row: number; col: number }) =>
        checkCorrectness(row, col) // Uses updated checkCorrectness
      );
      setCheckQueue([]);
    }, [checkQueue, checkCorrectness]); // Depends on updated checkCorrectness

    // Keep useMemo for crosswordComplete/Correct
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

    // Keep useEffect for crossword completion callbacks
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

    // Keep focus management
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

    // Keep handleSingleCharacter - updated in Step 2.5.8
    const handleSingleCharacter = useCallback(
      (char: string) => {
        onGuessAttempt?.(selectedRow, selectedCol, char.toUpperCase());
      },
      [selectedRow, selectedCol, onGuessAttempt] // Dependencies correct
    );

    // Keep handleInputKeyDown - updated in Step 2.5.8
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
            onMoveRequest?.(-1, 0);
            break;
          case 'ArrowDown':
            onMoveRequest?.(1, 0);
            break;
          case 'ArrowLeft':
            onMoveRequest?.(0, -1);
            break;
          case 'ArrowRight':
            onMoveRequest?.(0, 1);
            break;
          case ' ':
          case 'Tab': {
            onDirectionToggleRequest?.();
             if (key === ' ') {
                preventDefault = true;
             } else {
                preventDefault = true;
             }
            break;
          }
          case 'Backspace':
          case 'Delete': {
            // Forward unconditionally
            if (key === 'Backspace') {
              onBackspaceRequest?.();
            } else {
              onDeleteRequest?.();
            }
            break;
          }
          case 'Home':
          case 'End': {
            if (!data || !data[currentDirection] || !data[currentDirection][currentNumber]) break;
            const info = data[currentDirection][currentNumber];
            if (!info) break;
            const { answer: { length } } = info;
            let { row, col } = info;
            if (key === 'End') {
              const across = isAcross(currentDirection);
              if (across) { col += length - 1; } else { row += length - 1; }
            }
            onMoveToRequest?.(row, col);
            break;
          }
          default:
            if (key.length !== 1 || !/^[a-zA-Z]$/.test(key)) {
              preventDefault = false;
              break;
            }
            handleSingleCharacter(key); // Calls updated handleSingleCharacter
            break;
        }

        if (preventDefault) {
          event.preventDefault();
        }
      },
      // Dependencies correct after Step 2.5.8 changes
      [
        handleSingleCharacter,
        currentDirection,
        data,
        currentNumber,
        onMoveRequest,
        onDirectionToggleRequest,
        onBackspaceRequest,
        onDeleteRequest,
        onMoveToRequest,
      ]
    );

    // Keep handleInputChange and related useEffect
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
      handleSingleCharacter(bulkChange[0]); // Uses updated handleSingleCharacter
      setBulkChange(bulkChange.length === 1 ? null : bulkChange.substring(1));
    }, [bulkChange, handleSingleCharacter]); // Depends on updated handleSingleCharacter

    // Keep useEffect for loading/initializing clues & triggering checks
    useEffect(() => {
      if (!masterGridData) return;

      // Only copy master grid data for initial guess loading if useStorage=true
      const newGridData = useStorage
        ? masterGridData.map((row: CellData[]) =>
            row.map((cell: CellData) => ({ ...cell }))
          )
        : undefined; // Don't create if not using storage here

      const newCluesData: CluesData = {
        across: masterClues.across.map((clue: ClueDataItem) => ({ ...clue })),
        down: masterClues.down.map((clue: ClueDataItem) => ({ ...clue })),
      };

      if (useStorage && newGridData) {
        loadGuesses(newGridData, storageKey || defaultStorageKey);
      }

      setClues(newCluesData);

      // DELETED: setGridData(newGridData); // *** THIS LINE IS NOW CORRECTLY REMOVED ***

      // Trigger initial correctness check based on loaded guesses if applicable
      if (useStorage && newGridData) {
        const cellsToCheck: GridPosition[] = [];
         newGridData.forEach((row, r) => {
            row.forEach((cell, c) => {
              if (cell.used && cell.guess) {
                 cellsToCheck.push({ row: r, col: c });
              }
            });
         });
        setCheckQueue(produce((draft) => [...cellsToCheck]));
      }
    }, [masterClues, masterGridData, storageKey, useStorage, setClues, setCheckQueue]); // Dependencies correct

    // Update useEffect for saving guesses to use gridData prop
    useEffect(() => {
      if (!gridData || gridData.length === 0 || !useStorage) {
        return;
      }
      saveGuesses(gridData, storageKey || defaultStorageKey);
    }, [gridData, storageKey, useStorage]); // Depends on gridData prop

    // Keep handleCellClick
    const handleCellClick = useCallback(
      (cellData: CellData) => {
        if (cellData.used) {
          const { row, col } = cellData;
          onCellSelect?.(row, col);
        }
      },
      [onCellSelect, getCellData] // Depends on updated getCellData
    );

    // Keep handleInputClick
    const handleInputClick = useCallback<
      React.MouseEventHandler<HTMLInputElement>
    >(
      (event) => {
        onDirectionToggleRequest?.();
      },
      [onDirectionToggleRequest]
    );

    // Keep handleClueSelected
    const handleClueSelected = useCallback(
      (direction: Direction, number: string) => {
        const info = clues?.[direction]?.find(
          (clue: ClueDataItem) => clue.number === number
        );
        if (!info) { return; }
        onMoveToRequest?.(info.row, info.col);
        if (onClueSelected) {
          onClueSelected(direction, number);
        }
      },
      [clues, onClueSelected, onMoveToRequest]
    );

    // Keep registerFocusHandler
    const registerFocusHandler = useCallback(
      (focusHandler: FocusHandler | null) => {
        registeredFocusHandler.current = focusHandler;
      },
      [] // No dependencies
    );

    // Keep useImperativeHandle - updated in Step 2.5.8 cleanup
    useImperativeHandle(
      ref,
      () => ({
        focus,
        reset: () => {
          // Only update the clues state that we still manage
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
        },
        fillAllAnswers: () => {
          // Only update the clues state that we still manage
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

          // Trigger checks based on master data shape
          const cellsToCheck: GridPosition[] = [];
          masterGridData.forEach((masterRow, r) => {
            masterRow.forEach((cell, c) => {
              if (cell.used) {
                cellsToCheck.push({ row: r, col: c });
              }
            });
          });
          setCheckQueue(produce((draft) => [...cellsToCheck]));

          if (onLoadedCorrect) {
            const loadedCorrect: AnswerTuple[] = [];
            bothDirections.forEach((direction: Direction) => {
              masterClues[direction]?.forEach(({ number, answer }) => {
                loadedCorrect.push([direction, number, answer]);
              });
            });
            onLoadedCorrect(loadedCorrect);
          }
        },
        isCrosswordCorrect: () => crosswordCorrect,
        setGuess: (row: number, col: number, guess: string) => {
          // Forward the intent via onGuessAttempt
          onGuessAttempt?.(row, col, guess.toUpperCase());
        },
      }),
      // Dependencies correct after Step 2.5.8 cleanup
      [
        crosswordCorrect,
        focus,
        onLoadedCorrect,
        onGuessAttempt,
        storageKey,
        useStorage,
        setClues,
        setCheckQueue,
        masterGridData,
        masterClues,
      ]
    );

    // Keep useMemo for crosswordContext - updated in Step 2.5.9
    const crosswordContext = useMemo<CrosswordContextType>(
      () => ({
        rows,
        cols,
        gridData, // Uses gridData prop
        clues,
        cellCompletionStatus, // Add cell completion status
        handleInputKeyDown, // Uses updated handler
        handleInputChange,
        handleCellClick,
        handleInputClick,
        handleClueSelected,
        registerFocusHandler,
        handleSingleCharacter, // Uses updated handler
        focused,
        selectedPosition: { row: selectedRow, col: selectedCol },
        selectedDirection: currentDirection,
        selectedNumber: currentNumber,
        crosswordCorrect,
      }),
      // Dependencies correct after Step 2.5.9 update
      [
        rows, cols, gridData, clues, cellCompletionStatus,
        handleInputKeyDown, handleInputChange, handleCellClick, handleInputClick,
        handleClueSelected, registerFocusHandler, handleSingleCharacter,
        focused,
        selectedRow, selectedCol, currentDirection, currentNumber,
        crosswordCorrect,
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