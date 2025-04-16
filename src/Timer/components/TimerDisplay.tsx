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
const TimerContainer = styled.div<{ $visible: boolean; $stage: number }>`
  display: ${props => props.$visible ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 4px;
  margin: 8px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease;
  width: fit-content;
  align-self: center;
  background-color: ${props => {
    // Debug log for theme access
    console.log('Theme in styled component:', props.theme);
    console.log('Theme stage color access:', props.theme?.completionStage1Background);
    
    // Use the theme's stage colors based on current stage
    switch(props.$stage) {
      case 0: // Add case 0 to handle initial state visually like stage 1
      case 1: return props.theme.completionStage1Background; // Blue (0-30s)
      case 2: return props.theme.completionStage2Background; // Green (31-70s)
      case 3: return props.theme.completionStage3Background; // Yellow (71-120s)
      case 4: return props.theme.completionStage4Background; // Orange (121-180s)
      case 5: return props.theme.completionStage5Background; // Red (>180s)
      default: return props.theme.cellBackground || '#ccc'; // Default from theme with fallback
    }
  }};
  color: '#ffffff'; // Set text color unconditionally to white
`;

// TimerDisplay component
export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  elapsedTime, 
  currentStage, 
  isVisible 
}) => {
  // Access theme directly to check if it's available
  const theme = useContext(ThemeContext);
  console.log('Current stage:', currentStage);
  console.log('Theme access in component:', theme);
  console.log('Theme stage1 color:', theme?.completionStage1Background);
  
  const formattedTime = formatTime(elapsedTime);
  
  return (
    <TimerContainer $visible={isVisible} $stage={currentStage}>
      {formattedTime}
    </TimerContainer>
  );
};

export default TimerDisplay; 