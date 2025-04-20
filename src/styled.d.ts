import 'styled-components';

declare module 'styled-components' {
  // App theme definition
  export interface AppTheme {
    /**
     * Whether to allow a non-square rendering
     */
    allowNonSquare?: boolean;
    
    /**
     * Browser-width at which the clues go from showing beneath the grid to showing beside the grid
     */
    columnBreakpoint?: string;
    
    /**
     * Overall background color (fill) for the crossword grid
     * Can be 'transparent' to show through a page background image
     */
    gridBackground?: string;
    
    /**
     * Background for an answer cell
     */
    cellBackground?: string;
    
    /**
     * Border for an answer cell
     */
    cellBorder?: string;
    
    /**
     * Color for answer text (entered by the player)
     */
    textColor?: string;
    
    /**
     * Color for the across/down numbers in the grid
     */
    numberColor?: string;
    
    /**
     * Background color for the cell with focus, the one that the player is typing into
     */
    focusBackground?: string;
    
    /**
     * Background color for the cells in the answer the player is working on,
     * helps indicate in which direction focus will be moving; 
     * also used as a background on the active clue
     */
    highlightBackground?: string;
    
    /**
     * Color from the book title to use for borders
     */
    bookColor?: string;
    
    /**
     * Light green for correct answers
     */
    correctBackground?: string;
    
    /**
     * Green text for correct answers
     */
    correctColor?: string;
    
    /**
     * Bright gold background for correct words
     */
    wordCorrectBackground?: string;
    
    /**
     * Dark gold text for correct words
     */
    wordCorrectColor?: string;
    
    /**
     * Light blue background for completed words
     */
    completionBackground?: string;
    
    /**
     * Light gray background for progress bar
     */
    progressBarBackground?: string;
    
    /**
     * Progress bar fill color
     */
    progressBarFill?: string;
    
    /**
     * Blue background for stage 1 completion (0-30s)
     */
    completionStage1Background?: string;
    
    /**
     * Green background for stage 2 completion (31-70s)
     */
    completionStage2Background?: string;
    
    /**
     * Yellow background for stage 3 completion (71-120s)
     */
    completionStage3Background?: string;
    
    /**
     * Orange background for stage 4 completion (121-180s)
     */
    completionStage4Background?: string;
    
    /**
     * Red background for stage 5 completion (>180s)
     */
    completionStage5Background?: string;

    // Virtual Keyboard theme properties
    /**
     * Background color for the keyboard container
     */
    keyboardBackground?: string;

    /**
     * Background color for standard letter keys
     */
    keyBackground?: string;

    /**
     * Text color for keys
     */
    keyColor?: string;

    /**
     * Background color for special keys like backspace and enter
     */
    specialKeyBackground?: string;

    /**
     * Border color for keys
     */
    keyBorderColor?: string;

    /**
     * Border radius for keys
     */
    keyBorderRadius?: string;

    /**
     * Font size for keys
     */
    keyFontSize?: string;
  }

  // Extending DefaultTheme with our AppTheme
  export interface DefaultTheme extends AppTheme {}
} 