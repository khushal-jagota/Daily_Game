import { createGlobalStyle } from 'styled-components';

// Define and export timing constants
export const TRANSITION_DURATIONS = {
  fast: 100, // ms for focus/highlight
  slow: 1000, // ms for completion reveal
};

// Create global styles for transitions
export const GridTransitionStyles = createGlobalStyle`
  /* Base fast transition for focus/highlight & fallback */
  svg[data-crossword-grid="true"] g > rect,
  svg[data-crossword-grid="true"] text.guess-text {
    transition-property: fill;
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