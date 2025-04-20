import styled from 'styled-components';

// Main application wrapper that contains all layout components
export const AppWrapper = styled.div`
  display: grid;
  /* Explicit, valid grid‑template‑rows value: */
  grid-template-rows: auto 1fr max-content minmax(clamp(13rem,20vh,15rem), auto);

  /* Use svh with dvh fallback for viewport height */
  min-height: 100dvh; 
  @supports (min-height: 100svh) {
    min-height: 100svh;
  }
  width: 100%; 
  /* Apply safe-area padding using CSS variables */
  padding-top: var(--safe-area-inset-top);
  padding-right: var(--safe-area-inset-right);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
  gap: 0; /* Explicitly no gap between grid rows */
  overflow: hidden; /* Prevent AppWrapper itself from scrolling */
`;

// Top banner area with padding-based height
export const Banner = styled.div`
  padding: 0.75rem 1rem;
  background-color: #CCC;
`;

// Flexible middle area that contains the crossword grid
export const CrosswordArea = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

// Clue area with padding-based height
export const ClueArea = styled.div`
  background-color: ${props => props.theme.gridBackground || 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
`;

// Keyboard area with padding-based height
export const KeyboardArea = styled.div`
  padding: 0.75rem 0.1rem;
  background-color: ${props => props.theme.keyboardBackground || props.theme.gridBackground || '#EEE'};
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.1rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.25rem 0;
  }
`;

// Temporary placeholder for keyboard - will be removed when actual keyboard is implemented
export const KeyboardPlaceholder = styled.div`
  opacity: 0.5;
  color: ${props => props.theme.textColor || '#666'};
  font-size: 0.9rem;
  text-align: center;
`;

// Container for the timer and progress bar layout
export const TimerBarContainer = styled.div<{ $visible?: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  padding: 0.5rem 1rem;
  gap: 1rem;
  justify-content: space-between;
  width: 100%;
`;
