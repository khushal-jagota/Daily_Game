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


export const crosswordProviderPropTypes = {
  /**
   * clue/answer data; see <a
   * href="#/Configuration%20and%20customization/Clue%20input%20format">Clue
   * input format</a> for details.
   */
  data: cluesInputShapeOriginal.isRequired,

  /** presentation values for the crossword; these override any values coming from a parent ThemeProvider context. */
  // Removed PropTypes definition for theme, relying on TypeScript interface now
  // theme: PropTypes.shape({ ... }),

  /** whether to use browser storage to persist the player's work-in-progress */
  useStorage: PropTypes.bool,

  /**
   * a custom storage key to use for persistence; defaults to "guesses" when not
   * provided
   */
  storageKey: PropTypes.string,

  /**
   * callback function that fires when a player completes an answer, whether
   * correct or not; called with `(direction, number, correct, answer)`
   * arguments, where `direction` is `'across'` or `'down'`, `number` is the
   * clue number as text (like `'1'`), `correct` is whether the guessed answer
   * is correct and `answer` is the (actual and correct) answer itself
   *
   * @since 4.3.0
   */
  onAnswerComplete: PropTypes.func,

  /**
   * callback function that fires when a player answers a clue correctly; called
   * with `(direction, number, answer)` arguments, where `direction` is
   * `'across'` or `'down'`, `number` is the clue number as text (like `'1'`),
   * and `answer` is the answer itself
   *
   * @since 4.3.0; replacing `onCorrect` (to reduce ambiguity)
   */
  onAnswerCorrect: PropTypes.func,

  /**
   * callback function that fires when a player answers a clue correctly;
   * called with `(direction, number, answer)` arguments, where `direction` is
   * `'across'` or `'down'`, `number` is the clue number as text (like `'1'`),
   * and `answer` is the answer itself
   *
   * @deprecated 4.3.0; being replaced by `onAnswerCorrect` (to reduce
   * ambiguity)
   */
  onCorrect: PropTypes.func,

  /**
   * callback function that fires when a player answers a clue *in*correctly;
   * called with `(direction, number, answer)` arguments, where `direction` is
   * `'across'` or `'down'`, `number` is the clue number as text (like `'1'`),
   * and `answer` is the (actual and correct) answer itself
   *
   * @since 4.3.0
   */
  onAnswerIncorrect: PropTypes.func,

  /**
   * callback function that's called when a crossword is loaded, to batch up
   * correct answers loaded from storage; passed an array of the same values
   * that `onCorrect` would recieve
   */
  onLoadedCorrect: PropTypes.func,

  /**
   * callback function that's called when the overall crossword is complete,
   * whether correct or not; called with `(correct)` argument, a boolean which
   * indicates whether the crossword is correct or not.
   */
  onCrosswordComplete: PropTypes.func,

  /**
   * callback function that's called when the overall crossword is completely
   * correct (or not)
   *
   * NOTE: this will be deprecated for `onCrosswordComplete` in the future.
   */
  onCrosswordCorrect: PropTypes.func,

  /**
   * callback function called when a cell changes (e.g. when the user types a
   * letter); called with `(row, col, char)` arguments, where the `row` and
   * `column` are the 0-based position of the cell, and `char` is the character
   * typed (already massaged into upper-case)
   */
  onCellChange: PropTypes.func,

  /**
   * callback function called when a clue is selected
   */
  onClueSelected: PropTypes.func,

  /**
   * ADDED: callback function called when a cell is selected
   */
   onCellSelect: PropTypes.func,


  children: PropTypes.node,
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
     * Theme properties for the crossword
     */
    theme?: Partial<CrosswordTheme>;

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
    onCellSelect?: (row: number, col: number) => void;

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
  }
>;

export interface CrosswordProviderImperative {
  /**
   * Sets focus to the crossword component.
   */
  focus: () => void;

  /**
   * Resets the entire crossword; clearing all answers in the grid and
   * also any persisted data.
   */
  reset: () => void;

  /**
   * Fills all the answers in the grid and calls the `onLoadedCorrect`
   * callback with _**every**_ answer.
   */
  fillAllAnswers: () => void;

  /**
   * Returns whether the crossword is entirely correct or not.
   */
  isCrosswordCorrect: () => boolean;

  /**
   * Sets the "guess" character for a specific grid position.
   *
   * @since 4.1.0
   */
  setGuess: (row: number, col: number, guess: string) => void;
}

// Define the default theme values using the CrosswordTheme interface
const defaultTheme: CrosswordTheme = {
  allowNonSquare: false,
  columnBreakpoint: '768px',
  gridBackground: 'rgb(0,0,0)',
  cellBackground: 'rgb(255,255,255)',
  cellBorder: 'rgb(0,0,0)',
  textColor: 'rgb(0,0,0)',
  numberColor: 'rgba(0,0,0, 0.25)',
  focusBackground: 'rgb(255,255,0)',
  highlightBackground: 'rgb(255,255,204)',
  // Provide defaults for other theme properties if needed
  bookColor: undefined,
  correctBackground: '#a0e8a0', // Example default
  correctColor: '#053b05', // Example default
  wordCorrectBackground: '#ffe17a', // Example default
  wordCorrectColor: '#8b6b00', // Example default
  progressBarBackground: '#e0e0e0', // Example default
  progressBarFill: '#76c7c0', // Example default
};

/**
 * The fundamental logic and data management component for react-crossword.
 * Prior to 4.0, puzzle management was built into the `Crossword` component.  As
 * of 4.0, the logic implementation has been refactored such that `Crossword`
 * leverages `CrosswordProvider` to do the heavy lifting.
 *
 * @since 4.0
 */
const CrosswordProvider = React.forwardRef<
  CrosswordProviderImperative,
  CrosswordProviderProps
>(
  (
    {
      data,
      theme,
      onAnswerComplete,
      onAnswerCorrect,
      onCorrect,
      onAnswerIncorrect,
      onLoadedCorrect,
      onCrosswordComplete,
      onCrosswordCorrect,
      onCellChange,
      onClueSelected,
      onCellSelect, // Destructure new prop
      completedWordIds, // Destructure new prop
      useStorage = true, // Default value set here
      storageKey,
      children,
    },
    ref
  ) => {
    // Use the ThemeContext directly without the problematic type argument
    const contextTheme = useContext(ThemeContext);

    // The final theme is the merger of three values: the "theme" property
    // passed to the component (which takes precedence), any values from
    // ThemeContext, and finally the "defaultTheme" values fill in for any
    // needed ones that are missing.
    const finalTheme = useMemo<DefaultTheme>(
      () => {
        // First merge the themes in priority order
        const mergedTheme = { ...defaultTheme, ...contextTheme, ...theme };
        
        // Then clean the merged theme by replacing any null values with undefined
        // to ensure compatibility with DefaultTheme (which expects string | undefined)
        return Object.fromEntries(
          Object.entries(mergedTheme).map(([key, value]) => [key, value === null ? undefined : value])
        ) as DefaultTheme;
      },
      [contextTheme, theme]
    );

    // The original Crossword implementation used separate state to track size
    // and grid data, and conflated the clues-input-data-based grid data and the
    // player input guesses.  Let's see if we can keep the clues-input and
    // player data segregated.
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

    // We can't seem to use state to track the registeredFocusHandler, because
    // there seems to be a delay in 'focus' being usable after it's set.  We use
    // a Ref instead.
    const registeredFocusHandler = useRef<FocusHandler | null>(null);

    // interactive player state
    const [focused, setFocused] = useState(false);
    const [focusedRow, setFocusedRow] = useState(0); // rename to selectedRow?
    const [focusedCol, setFocusedCol] = useState(0);
    const [currentDirection, setCurrentDirection] =
      useState<Direction>('across');
    const [currentNumber, setCurrentNumber] = useState('1'); // Should initialize based on data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [bulkChange, setBulkChange] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [checkQueue, setCheckQueue] = useState<GridPosition[]>([]);

    // This *internal* getCellData assumes that it's only ever asked for a valid
    // cell (one that's used).
    const getCellData = useCallback(
      (row: number, col: number): CellData => { // Added return type
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          // Ensure gridData is initialized before accessing
          if (gridData && gridData[row] && gridData[row][col]) {
            return gridData[row][col];
          }
        }

        // fake cellData to represent "out of bounds" or uninitialized
        return { row, col, used: false, outOfBounds: true } as GridPosition &
          UnusedCellData;
      },
      [cols, gridData, rows]
    );

    // **MODIFIED for Input Blocking**
    const isCellEditable = useCallback((row: number, col: number): boolean => {
      const cell = getCellData(row, col);
      if (!cell.used) return false; // Can't edit unused cells

      const acrossNum = cell.across;
      const downNum = cell.down;

      if (acrossNum && completedWordIds?.has(`${acrossNum}-across`)) {
        return false; // Block if part of completed 'across' word
      }
      if (downNum && completedWordIds?.has(`${downNum}-down`)) {
        return false; // Block if part of completed 'down' word
      }

      return true; // Editable otherwise
    }, [getCellData, completedWordIds]);


    const setCellCharacter = useCallback(
      (row: number, col: number, char: string) => {
        const cell = getCellData(row, col);

        // Ensure the cell is editable before proceeding
        if (!cell.used || !isCellEditable(row, col)) {
           // Optionally move forward even if not editable? Or just return?
           // For now, just return to block. Consider moveForward() later if needed.
           return;
        }

        // If the character is already the cell's guess, there's nothing to do.
        if (cell.guess === char) {
          return;
        }

        // **REMOVED old blocking logic based on recalculation**

        // update the gridData with the guess
        setGridData(
          produce((draft: GridData) => {
             // Ensure draft and draft[row] exist before accessing
            if (draft && draft[row] && draft[row][col]) {
              (draft[row][col] as UsedCellData).guess = char;
            }
          })
        );

        // push the row/col for checking!
        setCheckQueue(
          produce((draft: Array<{row: number; col: number}>) => {
            draft.push({ row, col });
          })
        );

        if (onCellChange) {
          onCellChange(row, col, char);
        }
      },
      [getCellData, isCellEditable, onCellChange, setGridData, setCheckQueue] // Added isCellEditable dependency
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

          // NOTE: onCorrect to be (eventually) deprecated
          if (onCorrect) {
            onCorrect(direction, number, answer);
          }
        } else if (onAnswerIncorrect) {
          onAnswerIncorrect(direction, number, answer);
        }
      },
      [onAnswerComplete, onAnswerCorrect, onAnswerIncorrect, onCorrect]
    );

    const checkCorrectness = useCallback(
      (row: number, col: number) => {
        const cell = getCellData(row, col);
        if (!cell.used) {
          /* istanbul ignore next */
          throw new Error('unexpected unused cell');
        }

        // check all the cells for both across and down answers that use this cell
        bothDirections.forEach((direction: Direction) => {
          const across = isAcross(direction);
          const number = cell[direction];
          if (!number) {
            return;
          }

          // Added check for data existence
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
            ); // Removed cast, rely on getCellData's return type

            if (!checkCell.used || !checkCell.guess) { // Check if used and has guess
              complete = false;
              correct = false;
              break;
            }

            if (checkCell.guess !== checkCell.answer) {
              correct = false;
            }
          }

          // update the clue state
          setClues(
            produce((draft: CluesData | undefined) => {
              if (draft) {
                // Find the clue using the correct type
                const clueInfo = draft[direction]?.find( // Added optional chaining
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
      [data, getCellData, notifyAnswerComplete]
    );

    // Any time the checkQueue changes, call checkCorrectness!
    useEffect(() => {
      if (checkQueue.length === 0) {
        return;
      }

      // Added type annotation for destructured parameters
      checkQueue.forEach(({ row, col }: { row: number; col: number }) => checkCorrectness(row, col));
      setCheckQueue([]);
    }, [checkQueue, checkCorrectness]);

    // Any time the clues change, determine if they are all complete/correct or not.
    const { crosswordComplete, crosswordCorrect } = useMemo(() => {
      // Added optional chaining for safety
      const complete = !!(
        clues &&
        bothDirections.every((direction: Direction) => // Added type
          clues[direction]?.every((clueInfo: ClueDataItem) => clueInfo.complete) // Added type and optional chaining
        )
      );

      const correct =
        complete &&
        !!(
          clues &&
          bothDirections.every((direction: Direction) => // Added type
            clues[direction]?.every((clueInfo: ClueDataItem) => clueInfo.correct) // Added type and optional chaining
          )
        );

      return { crosswordComplete: complete, crosswordCorrect: correct };
    }, [clues]);


    // Let the consumer know everything's correct (or not) if they've asked to
    // be informed.
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

    // focus and movement
    const focus = useCallback(() => {
      if (registeredFocusHandler.current) {
        registeredFocusHandler.current();
        setFocused(true);
      } else {
        console.warn(
          'CrosswordProvider: focus() has no registered handler to call!'
        );
      }
    }, []);

    const moveTo = useCallback(
      (row: number, col: number, directionOverride?: Direction): boolean | UsedCellData => { // Return boolean | UsedCellData
        let direction = directionOverride ?? currentDirection;
        const candidate = getCellData(row, col);

        if (!candidate.used) {
          return false;
        }

        if (!candidate[direction]) {
          /* istanbul ignore next */
          direction = otherDirection(direction);
          // If still no direction, something is wrong, maybe return false?
          if (!candidate[direction]) return false;
        }

        setFocusedRow(row);
        setFocusedCol(col);
        setCurrentDirection(direction);
        setCurrentNumber(candidate[direction] ?? ''); // Use empty string if undefined

        return candidate; // Return the cell data
      },
      [currentDirection, getCellData]
    );


    const moveRelative = useCallback(
      (dRow: number, dCol: number) => {
        let direction: Direction | undefined;
        if (dRow !== 0 && dCol === 0) {
          direction = 'down';
        } else if (dRow === 0 && dCol !== 0) {
          direction = 'across';
        }

        const cell = moveTo(focusedRow + dRow, focusedCol + dCol, direction);

        // Maybe return boolean indicating success?
        return !!cell; // Return true if move was successful (found a used cell)
      },
      [focusedRow, focusedCol, moveTo]
    );

    const moveForward = useCallback(() => {
      const across = isAcross(currentDirection);
      moveRelative(across ? 0 : 1, across ? 1 : 0);
    }, [currentDirection, moveRelative]);

    const moveBackward = useCallback(() => {
      const across = isAcross(currentDirection);
      moveRelative(across ? 0 : -1, across ? -1 : 0);
    }, [currentDirection, moveRelative]);

    // keyboard handling
    const handleSingleCharacter = useCallback(
      (char: string) => {
        // Use the check function first
        if (!isCellEditable(focusedRow, focusedCol)) {
            moveForward(); // Move forward even if not editable
            return;
        }

        // REMOVED old blocking logic

        // Otherwise, set the character and move forward
        setCellCharacter(focusedRow, focusedCol, char.toUpperCase());
        moveForward();
      },
      [focusedRow, focusedCol, isCellEditable, setCellCharacter, moveForward] // Added isCellEditable dependency
    );

    // We use the keydown event for control/arrow keys, but not for textual
    // input, because it's hard to suss out when a key is "regular" or not.
    const handleInputKeyDown = useCallback<
      React.KeyboardEventHandler<HTMLInputElement>
    >(
      (event) => {
        // if ctrl, alt, or meta are down, ignore the event (let it bubble)
        if (event.ctrlKey || event.altKey || event.metaKey) {
          return;
        }

        let preventDefault = true;
        const { key } = event;

        switch (key) {
          case 'ArrowUp':
            moveRelative(-1, 0);
            break;

          case 'ArrowDown':
            moveRelative(1, 0);
            break;

          case 'ArrowLeft':
            moveRelative(0, -1);
            break;

          case 'ArrowRight':
            moveRelative(0, 1);
            break;

          case ' ': // treat space like tab?
          case 'Tab': {
            const other = otherDirection(currentDirection);
            const cellData = getCellData(focusedRow, focusedCol); // Removed cast
            // Ensure cellData is used before checking direction property
            if (cellData.used && cellData[other]) {
              setCurrentDirection(other);
              setCurrentNumber(cellData[other] ?? '');
            }
            // Prevent default for spacebar if used for direction toggle
            if (key === ' ') {
               preventDefault = true;
            } else {
               // Let Tab default behavior continue if not toggling direction
               // or if cell doesn't support the other direction
               preventDefault = !!(cellData.used && cellData[other]);
            }
            break;
          }

          // Backspace: delete the current cell, and move to the previous cell
          // Delete:    delete the current cell, but don't move
          case 'Backspace':
          case 'Delete': {
            // Check if the cell is editable before deleting
            if (isCellEditable(focusedRow, focusedCol)) {
                setCellCharacter(focusedRow, focusedCol, '');
            }
            // Move backward for backspace only if character was deleted or cell was already empty
            // Or maybe always move backward for backspace? Let's stick with original logic for now.
            if (key === 'Backspace') {
              moveBackward();
            }
            break;
          }

          case 'Home':
          case 'End': {
            // Check data existence
            if (!data || !data[currentDirection] || !data[currentDirection][currentNumber]) break;
            const info = data[currentDirection][currentNumber];
            if (!info) break; // Should not happen if currentNumber is valid

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

            moveTo(row, col);
            break;
          }

          default:
            if (key.length !== 1 || !/^[a-zA-Z]$/.test(key)) { // Basic check for single letters
              preventDefault = false;
              break;
            }

            handleSingleCharacter(key);
            break;
        }

        if (preventDefault) {
          event.preventDefault();
        }
      },
      [
        moveRelative,
        handleSingleCharacter,
        currentDirection,
        getCellData,
        focusedRow,
        focusedCol,
        isCellEditable, // Added dependency
        setCellCharacter,
        moveBackward,
        data,
        currentNumber,
        moveTo,
      ]
    );

    const handleInputChange = useCallback<
      React.ChangeEventHandler<HTMLInputElement>
    >((event) => {
      event.preventDefault();
      setBulkChange(event.target.value);
    }, []);

    useEffect(() => {
      if (!bulkChange) {
        return;
      }

      handleSingleCharacter(bulkChange[0]);
      setBulkChange(bulkChange.length === 1 ? null : bulkChange.substring(1));
    }, [bulkChange, handleSingleCharacter]);

    // When the clues *input* data changes, reset/reload the player data
    useEffect(() => {
      // Added null check for masterGridData
      if (!masterGridData) return;

      const newGridData = masterGridData.map((row: CellData[]) => // Added type
        row.map((cell: CellData) => ({ ...cell })) // Added type
      );

      const newCluesData: CluesData = {
        across: masterClues.across.map((clue: ClueDataItem) => ({ ...clue })), // Added type
        down: masterClues.down.map((clue: ClueDataItem) => ({ ...clue })), // Added type
      };

      if (useStorage) {
        loadGuesses(newGridData, storageKey || defaultStorageKey);
      }

      setClues(newCluesData);
      setGridData(newGridData);

      if (useStorage) {
        setCheckQueue(
          bothDirections.flatMap((dir: Direction) => // Added type
             // Added check for existence and optional chaining
            newCluesData[dir]?.map(({ row, col }: { row: number; col: number }) => ({ row, col })) ?? [] // Added type, optional chaining, default empty array
          )
        );
      }

      // Initialize focus to the first available clue
      const firstAcrossClue = newCluesData.across[0];
      const firstDownClue = newCluesData.down[0];

      if (firstAcrossClue) {
        setFocusedRow(firstAcrossClue.row);
        setFocusedCol(firstAcrossClue.col);
        setCurrentDirection('across');
        setCurrentNumber(firstAcrossClue.number);
      } else if (firstDownClue) {
        setFocusedRow(firstDownClue.row);
        setFocusedCol(firstDownClue.col);
        setCurrentDirection('down');
        setCurrentNumber(firstDownClue.number);
      } else {
        // Fallback if no clues exist?
        setFocusedRow(0);
        setFocusedCol(0);
        setCurrentDirection('across');
        setCurrentNumber('');
      }


    }, [masterClues, masterGridData, storageKey, useStorage]);

    // save the guesses any time they change...
    useEffect(() => {
      // Added null check for gridData
      if (!gridData || gridData.length === 0 || !useStorage) {
        return;
      }

      saveGuesses(gridData, storageKey || defaultStorageKey);
    }, [gridData, storageKey, useStorage]);

    const handleCellClick = useCallback(
      (cellData: CellData) => {
        if (cellData.used) {
          const { row, col } = cellData;

          // Call the upstream handler FIRST, so GSM state is updated
          onCellSelect?.(row, col);

          // Helper function to check if a word in a given direction is complete and correct
          // ** NOTE: This recalculates based on current gridData, might be slightly out of sync
          // ** if onCellSelect caused an async update. Ideally, use completedWordIds here too,
          // ** but keeping original logic for now, assuming completion check is fast.
          const isWordComplete = (direction: Direction): boolean => {
            const number = cellData[direction];
            if (!number) return false;

            // Added check for data existence
            if (!data || !data[direction] || !data[direction][number]) return false;
            const info = data[direction][number];
            const across = isAcross(direction);

            let complete = true;
            let correct = true;

            for (let i = 0; i < info.answer.length; i++) {
              const checkCell = getCellData(
                info.row + (across ? 0 : i),
                info.col + (across ? i : 0)
              );
              if (!checkCell.used || !checkCell.guess) {
                complete = false; correct = false; break;
              }
              if (checkCell.guess !== checkCell.answer) {
                 correct = false;
              }
            }
            return complete && correct;
          };

          // Determine direction switching based on completion status and user interaction
          const currentIsComplete = isWordComplete(currentDirection);
          const otherDir = otherDirection(currentDirection);
          const otherIsComplete = cellData[otherDir] ? isWordComplete(otherDir) : false; // Check if otherDir exists

          let direction = currentDirection;

          if (currentIsComplete && !otherIsComplete && cellData[otherDir]) {
            direction = otherDir;
          } else if (
            !cellData[currentDirection] ||
            (focused && row === focusedRow && col === focusedCol && cellData[otherDir])
          ) {
            direction = otherDir;
          } else if (!cellData[currentDirection] && cellData[otherDir]) {
             // If current dir invalid, switch to other if valid
             direction = otherDir;
          }
          // else: keep current direction

          // Update internal state
          setFocusedRow(row);
          setFocusedCol(col);
          setCurrentDirection(direction);
          setCurrentNumber(cellData[direction] ?? ''); // Use determined direction

          // Only set focus if the selected cell is editable
          if (isCellEditable(row, col)) {
             focus();
          }
        }
      },
      [currentDirection, focus, focused, focusedCol, focusedRow, data, getCellData, isCellEditable, onCellSelect] // Added dependencies
    );


    const handleInputClick = useCallback<
      React.MouseEventHandler<HTMLInputElement>
    >(
      (event) => {
        // Let browser handle focus
        // event.preventDefault(); // Removed preventDefault

        const cellData = getCellData(focusedRow, focusedCol);
        if (!cellData.used) return; // Should not happen if input is focused

        const other = otherDirection(currentDirection);
        let direction = currentDirection;

        // Toggle direction only if the other direction is valid for this cell
        if (focused && cellData[other]) {
          direction = other;
          setCurrentDirection(other);
          setCurrentNumber(cellData[other] ?? '');
        } else {
           // If only one direction, ensure number is set correctly
           setCurrentNumber(cellData[direction] ?? '');
        }

        // No need to call focus() explicitly if we don't preventDefault
        // focus();
      },
      [currentDirection, /*focus,*/ focused, focusedCol, focusedRow, getCellData]
    );

    const handleClueSelected = useCallback(
      (direction: Direction, number: string) => {
        // Added optional chaining
        const info = clues?.[direction]?.find((clue: ClueDataItem) => clue.number === number); // Added type

        if (!info) {
          return;
        }

        moveTo(info.row, info.col, direction);
        // Only focus if the first cell of the clue is editable
        if (isCellEditable(info.row, info.col)) {
            focus();
        }


        if (onClueSelected) {
          onClueSelected(direction, number);
        }
      },
      [clues, focus, moveTo, onClueSelected, isCellEditable] // Added isCellEditable dependency
    );


    const registerFocusHandler = useCallback(
      (focusHandler: FocusHandler | null) => {
        registeredFocusHandler.current = focusHandler;
      },
      []
    );

    // imperative commands...
    useImperativeHandle(
      ref,
      () => ({
        focus,
        reset: () => {
          setGridData(
            produce((draft: GridData) => {
              // Added type annotations
              draft.forEach((rowData: CellData[]) => {
                rowData.forEach((cellData: CellData) => {
                  if (cellData.used) {
                    // Ensure guess property exists before assigning
                    (cellData as UsedCellData).guess = '';
                  }
                });
              });
            })
          );

          setClues(
            produce((draft: CluesData | undefined) => {
              // Added type annotations and optional chaining
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
          // Reset focus to start after reset?
          // Maybe call moveTo(initialRow, initialCol, initialDirection)?
        },
        fillAllAnswers: () => {
          setGridData(
            produce((draft: GridData) => {
              // Added type annotations
              draft.forEach((rowData: CellData[]) => {
                rowData.forEach((cellData: CellData) => {
                  if (cellData.used) {
                    // Ensure guess property exists before assigning
                    (cellData as UsedCellData).guess = (cellData as UsedCellData).answer;
                  }
                });
              });
            })
          );

          setClues(
            produce((draft: CluesData | undefined) => {
              // Added type annotations and optional chaining
              bothDirections.forEach((direction: Direction) => {
                draft?.[direction]?.forEach((clueInfo: ClueDataItem) => {
                  clueInfo.complete = true;
                  clueInfo.correct = true;
                });
              });
            })
          );

          if (onLoadedCorrect) {
            const loadedCorrect: AnswerTuple[] = [];
            // Added optional chaining and type annotation
            bothDirections.forEach((direction: Direction) => {
              clues?.[direction]?.forEach(({ number, answer }: { number: string; answer: string }) => {
                loadedCorrect.push([direction, number, answer]);
              });
            });

            onLoadedCorrect(loadedCorrect);
          }
        },
        isCrosswordCorrect: () => crosswordCorrect,
        setGuess: (row: number, col: number, guess: string) => {
          // Check editability before setting guess
           if (isCellEditable(row, col)) {
             setCellCharacter(row, col, guess.toUpperCase());
           }
        },
      }),
      [
        clues, // Removed - state variable, shouldn't be dependency?
        crosswordCorrect, // Derived state, okay as dependency
        focus,
        onLoadedCorrect,
        isCellEditable, // Added dependency
        setCellCharacter,
        storageKey,
        useStorage,
      ] // Removed clues from dependency array - might cause stale closures if not handled carefully
    );


    // Recalculate context value only when absolutely necessary
    const crosswordContext = useMemo<CrosswordContextType>(
      () => ({
        rows,
        cols,
        gridData,
        clues,

        handleInputKeyDown,
        handleInputChange,
        handleCellClick,
        handleInputClick,
        handleClueSelected,
        registerFocusHandler,
        handleSingleCharacter,

        focused,
        selectedPosition: { row: focusedRow, col: focusedCol },
        selectedDirection: currentDirection,
        selectedNumber: currentNumber,

        crosswordCorrect,
      }),
      [
        rows, cols, gridData, clues, // gridData and clues change often
        handleInputKeyDown, handleInputChange, handleCellClick, handleInputClick, handleClueSelected, registerFocusHandler, handleSingleCharacter, // Callbacks likely stable if defined with useCallback
        focused, focusedRow, focusedCol, currentDirection, currentNumber, // Interactive state changes often
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

// defaultProps removed as per previous step