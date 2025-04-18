import styled from 'styled-components';

// Main application wrapper that contains all layout components
export const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  padding-top: var(--safe-area-inset-top);
  padding-right: var(--safe-area-inset-right);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
`;

// Top banner area with padding-based height
export const Banner = styled.div`
  flex: 0 0 auto;
  padding: 0.75rem 1rem;
  background-color: #CCC;
`;

// Flexible middle area that contains the crossword grid
export const CrosswordArea = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;

// Clue area with padding-based height
export const ClueArea = styled.div`
  flex: 0 0 auto;
  padding: 0.75rem 1rem;
  min-height: 3rem;
  background-color: ${props => props.theme.gridBackground || 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  width: 100%;
`;

// Keyboard area with padding-based height
export const KeyboardArea = styled.div`
  flex: 0 0 auto;
  padding: 1rem;
  min-height: 8rem;
  background-color: #EEE;
`;

// Container for the timer and progress bar layout
export const TimerBarContainer = styled.div<{ $visible?: boolean }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  flex: 0 0 auto;
  align-items: center;
  padding: 0.5rem 1rem;
  gap: 1rem;
  justify-content: space-between;
  width: 100%;
`;
