import React, { useContext } from 'react';
import styled, { ThemeContext } from 'styled-components';

// Interface for TimerDisplay props
interface TimerDisplayProps {
  /** Time elapsed in seconds */
  elapsedTime: number;
  /** Current stage (1-5) based on elapsed time */
  currentStage: number;
  /** Whether the timer should be visible */
  isVisible: boolean;
}

// Format seconds into MM:SS format
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Styled container for the timer - using theme colors instead of local definitions
const TimerContainer = styled.div<{ $stage: number }>`
  /* --- Typography & Stability --- */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-variant-numeric: tabular-nums;
  font-size: clamp(1.3rem, 3.5vw, 2rem);
  font-weight: 600;
  line-height: 1.2;
  min-width: 5ch;
  text-align: center;

  /* --- Dynamic Text Color --- */
  color: ${props => {
    switch(props.$stage) {
      case 0: // Use Stage 1 color for consistency
      case 1: return props.theme.completionStage1Background; // Blue Text
      case 2: return props.theme.completionStage2Background; // Green Text
      case 3: return props.theme.completionStage3Background; // Yellow Text
      case 4: return props.theme.completionStage4Background; // Orange Text
      case 5: return props.theme.completionStage5Background; // Red Text
      default: return props.theme.textColor || '#111'; // Fallback
    }
  }};
`;

// TimerDisplay component
export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  elapsedTime, 
  currentStage, 
  isVisible // Keep the prop for backward compatibility
}) => {
  // Access theme directly to check if it's available
  const theme = useContext(ThemeContext);
  
  const formattedTime = formatTime(elapsedTime);
  
  return (
    <TimerContainer $stage={currentStage}>
      {formattedTime}
    </TimerContainer>
  );
};

export default TimerDisplay; 