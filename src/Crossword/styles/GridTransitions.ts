import { createGlobalStyle } from 'styled-components';

// Define and export timing constants
export const TRANSITION_DURATIONS = {
  fast: 120, // ms for focus/highlight
  slow: 300, // ms for completion reveal
};

export const CASCADE_DELAY_FACTOR = 80; // ms per letter

// Create global styles for transitions
export const GridTransitionStyles = createGlobalStyle`
  /* Base fast transition for focus/highlight & fallback */
  svg[data-crossword-grid="true"] g > rect,
  svg[data-crossword-grid="true"] text.guess-text {
    transition-property: fill;
    transition-duration: ${TRANSITION_DURATIONS.fast}ms;
    transition-timing-function: ease-out;
    transition-delay: 0ms; /* Explicitly default to no delay */
  }

  /* Accessibility considerations */
  @media (prefers-reduced-motion: reduce) {
    svg[data-crossword-grid="true"] g > rect,
    svg[data-crossword-grid="true"] text.guess-text {
      transition: none;
    }
  }
`; 