/**
 * CrosswordTheme defines the theme properties used across Crossword components
 */
export interface CrosswordTheme {
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
   * Light gray background for progress bar
   */
  progressBarBackground?: string;
  
  /**
   * Green fill for progress bar
   */
  progressBarFill?: string;
} 