import styled from 'styled-components';

// Main application wrapper that contains all layout components
export const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

// Top banner area with fixed height
export const Banner = styled.div`
  height: 50px;
  background-color: #CCC;
  flex-shrink: 0;
`;

// Flexible middle area that contains the crossword grid
export const CrosswordArea = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  overflow: hidden;
`;

// Fixed height area for showing current clue
export const ClueArea = styled.div`
  height: 70px;
  background-color: #DDD;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Fixed height area for keyboard at bottom
export const KeyboardArea = styled.div`
  height: 200px;
  background-color: #EEE;
  flex-shrink: 0;
`;
