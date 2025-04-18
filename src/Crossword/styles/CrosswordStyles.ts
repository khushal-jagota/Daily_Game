import styled, { createGlobalStyle, keyframes } from 'styled-components';

// Canonical theme object with all required properties for crossword components
export const crosswordTheme = {
  // Core theme properties
  allowNonSquare: false,
  columnBreakpoint: '768px',
  gridBackground: '#fffaf0',
  cellBackground: '#fffaf0',
  cellBorder: '#dde1e4',
  textColor: '#2c3e50',
  numberColor: '#7f8c8d',
  focusBackground: '#e3f2fd',
  highlightBackground: '#f5f9ff',
  bookColor: undefined, // Optional property
  
  // Correct answer styling
  correctBackground: '#e6f7e9', // Light green for correct answers
  correctColor: '#27ae60',      // Green text for correct answers
  wordCorrectBackground: '#FFD700', // Bright gold background for correct words
  wordCorrectColor: '#B8860B',      // Dark gold text for correct words
  
  // Completion styling
  completionBackground: '#b3e0ff', // Light blue for completed words
  
  // Progress tracking
  progressBarBackground: '#e9ecef', // Light gray background for progress bar
  progressBarFill: '#28a745',       // Green fill for progress bar
  
  // Timer completion stage colors
  completionStage1Background: '#2196F3', // Blue (0-30s)
  completionStage2Background: '#4CAF50', // Green (31-70s)
  completionStage3Background: '#FFC107', // Yellow (71-120s)
  completionStage4Background: '#FF9800', // Orange (121-180s)
  completionStage5Background: '#F44336', // Red (>180s)
};

// For backward compatibility
export const theme = crosswordTheme;

// Define pulse animation for word completion
const wordGoldPulse = keyframes`
  0% { 
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.05);
    filter: brightness(1.02); 
  }
  100% { 
    transform: scale(1);
    filter: brightness(1);
  }
`;

// Define pulse animation for completion header indicator
const headerCompletePulse = keyframes`
  0% { 
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.03);
    filter: brightness(1.1);
  }
  100% { 
    transform: scale(1);
    filter: brightness(1);
  }
`;

// Add CSS for correct answers
export const GlobalStyle = createGlobalStyle`
  .guess-text-correct {
    fill: ${crosswordTheme.correctColor} !important;
  }
  
  .guess-text-correct + rect {
    fill: ${crosswordTheme.correctBackground} !important;
  }
  
  .cell-correct {
    /* Remove pointer-events: none to allow clicking */
  }
  
  .cell-correct rect {
    fill: ${crosswordTheme.correctBackground} !important;
  }
  
  .cell-correct text:last-child {
    fill: ${crosswordTheme.correctColor} !important;
  }
  
  /* Styling for cells in a complete correct word - with higher specificity and !important to override */
  g.clue-cell.word-correct {
    animation: ${wordGoldPulse} 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-origin: center;
    overflow: visible !important; /* Ensure pulse isn't clipped */
    z-index: 10; /* Make sure the animated cells appear above others */
  }
  
  g.clue-cell.word-correct rect {
    fill: ${crosswordTheme.wordCorrectBackground} !important;
    transition: fill 0.3s ease-in-out;
  }
  
  g.clue-cell.word-correct text:last-child {
    fill: ${crosswordTheme.wordCorrectColor} !important;
    transition: fill 0.3s ease-in-out;
  }
  
  /* Header completion indicator animation */
  .puzzle-complete-indicator {
    animation: ${headerCompletePulse} 1.5s ease-in-out infinite;
    transform-origin: center;
    display: inline-block;
  }

  /* Accessibility considerations */
  @media (prefers-reduced-motion: reduce) {
    g.clue-cell.word-correct,
    .puzzle-complete-indicator {
      animation: none;
    }
  }
`;

export const BookTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
  background-color: #f39c12;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px 8px 0 0;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    padding: 0.5rem 1rem;
    margin-bottom: 0.5rem;
  }
`;

export const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

// Crossword section with fixed dimensions to avoid distortion
export const CrosswordSection = styled.div`
  flex: 1;
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 992px) {
    width: 100%;
    flex: none;
    margin-bottom: 0.25rem;
  }
`;

export const HintSection = styled.div<{ $themeColor?: string }>`
  flex: 1;
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0.75rem 1rem 0.25rem;
  border-left: ${props => props.$themeColor ? `1px solid ${props.$themeColor}40` : '1px solid #f0f0f0'};
  
  @media (max-width: 992px) {
    width: 100%;
    flex: none;
    border-left: none;
    border-top: ${props => props.$themeColor ? `1px solid ${props.$themeColor}40` : '1px solid #f0f0f0'};
    padding: 0.75rem 0.75rem 0.25rem;
    margin-top: 0.25rem;
  }
  
  @media (max-width: 768px) {
    /* Optimize space allocation for word circle on mobile */
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.5rem 0.25rem;
    
    /* Give less space to the clue box to allow more space for the word circle */
    & > div:first-child {
      flex: 0 0 auto;
      min-height: 70px;
    }
    
    /* Give more space to the word circle container */
    & > div:last-child {
      flex: 1;
      margin-top: 0;
    }
  }
  
  @media (max-width: 414px) {
    padding: 0.4rem 0.3rem 0.2rem;
    
    /* Even less space for clue box on very small screens */
    & > div:first-child {
      min-height: 60px;
    }
    
    /* Maximize space for word circle */
    & > div:last-child {
      margin-top: 0;
    }
  }
`;

export const OutsideCardContainer = styled.div`
  margin: 0.5rem 0;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  min-height: 30px; /* Reduced from 40px to make container shorter */
  
  @media (max-width: 768px) {
    min-height: 24px; /* Reduced from 30px */
    margin: 0.2rem 0 0.15rem;
    gap: 0.25rem;
  }
  
  @media (max-width: 414px) {
    min-height: 20px; /* Reduced height for small screens */
    margin: 0.1rem 0 0.05rem;
    gap: 0.15rem;
  }
`;

export const CardContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  height: 100%;
  overflow: hidden; // Prevent overflow
  
  @media (max-width: 992px) {
    gap: 0.5rem;
  }
  
  @media (max-width: 414px) {
    gap: 0.25rem;
  }
`;

// Update CrosswordWrapper with fixed dimensions to maintain aspect ratio
export const CrosswordWrapper = styled.div`
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
`;

export const GameContainer = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  margin-bottom: 2rem;
`;

export const Title = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 2rem;
  text-align: center;
`;

export const CurrentClueContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 1.5rem;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const ClueDirection = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
`;

export const ClueContent = styled.div`
  font-size: 1.15rem;
  color: #2c3e50;
  font-weight: 400;
  line-height: 1.4;
  word-wrap: break-word;
  padding-left: 0.15rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.35;
  }
  
  @media (max-width: 414px) {
    font-size: 0.95rem;
    line-height: 1.3;
    padding-left: 0.1rem;
  }
`;

export const ClueNumber = styled.span`
  font-weight: 700;
  margin-right: 0.5rem;
`;

export const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

export const Button = styled.button`
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #2980b9;
  }
`;

export const CurrentWordContainer = styled.div`
  background: transparent;
  padding: 0.5rem 0 0.5rem;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 0.5rem;
  overflow: visible;
  
  @media (max-width: 992px) {
    padding: 0.25rem 0 0.5rem;
    margin-top: 0.5rem;
    min-height: 220px; // Keep same height on tablets
  }
  
  @media (max-width: 768px) {
    padding: 0rem 0 0.25rem; // Reduced top padding from 0.25rem to 0rem
    margin-top: 0.5rem; // Reduced from 1rem to make it more compact
    min-height: 230px; // Reduced from 250px to make it more compact
  }
  
  @media (max-width: 414px) {
    padding: 0rem 0 0.1rem; // Removed top padding (was 0.25rem)
    margin-top: 0.25rem; // Reduced from 1.25rem for a more compact layout
    min-height: 210px; // Reduced from 230px for more compact layout
  }
`;

export const CurrentWordTitle = styled.h2`
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  text-align: center;
`;

interface CardTitleBannerProps {
  bookTitle?: string;
}

// Function to generate a consistent color based on a string
export const getColorFromString = (str: string = '') => {
  // Define a set of vibrant, readable colors for book titles
  const bookColors = [
    '#4A90E2', // Slightly softer Blue
    '#E67E22', // Slightly softer Red
    '#2ECC71', // Slightly softer Green
    '#F1C40F', // Slightly softer Orange
    '#9B59B6', // Slightly softer Purple
    '#1ABC9C', // Slightly softer Teal
    '#D35400', // Slightly softer Dark Orange
    '#3498DB', // Slightly softer Dark Blue
    '#E74C3C', // Slightly softer Dark Red
    '#27AE60', // Slightly softer Dark Green
    '#8E44AD', // Slightly softer Dark Purple
  ];
  
  // Simple hash function to get a number from string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to select a color from our palette
  const index = Math.abs(hash) % bookColors.length;
  return bookColors[index];
};

// Title banners
export const CardTitleBanner = styled.div<CardTitleBannerProps>`
  background-color: ${props => getColorFromString(props.bookTitle)};
  color: white;
  padding: 0.75rem 1.25rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 16px 16px 0 0;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border-radius: 14px 14px 0 0;
  }
  
  @media (max-width: 414px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
    border-radius: 12px 12px 0 0;
  }
`;