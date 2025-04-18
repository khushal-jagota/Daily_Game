import React from 'react';
import styled from 'styled-components';

// Define the ProgressBarContainer styled component
const ProgressBarContainer = styled.div`
  position: relative;
  overflow: hidden;
  flex-grow: 1;
  height: 0.8rem;
  background-color: ${props => props.theme.progressBarBackground || '#eee'};
  border-radius: 999px;
`;

// Define the ProgressBarFill styled component that drains from right to left
// We use a different approach with transform-origin and scaleX
const ProgressBarFill = styled.div<{ $ratio: number; $stage: number }>`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  transform-origin: left center;
  transform: scaleX(${props => props.$ratio});
  transition: transform 0.1s linear, background-color 0.3s ease;
  border-radius: 999px;
  
  /* Use theme's stage colors based on current stage */
  background-color: ${props => {
    switch(props.$stage) {
      case 0: // Not started - use Stage 1 color
      case 1: return props.theme.completionStage1Background; // Blue (0-30s)
      case 2: return props.theme.completionStage2Background; // Green (31-70s)
      case 3: return props.theme.completionStage3Background; // Yellow (71-120s)
      case 4: return props.theme.completionStage4Background; // Orange (121-180s)
      case 5: return props.theme.completionStage5Background; // Red (>180s)
      default: return props.theme.completionStage1Background; // Default to Stage 1 color
    }
  }};
`;

// Define the component's props interface
interface StageProgressBarProps {
  /** Ratio of time remaining in the current stage (1.0 to 0.0) */
  ratio: number;
  /** Current stage (0-5) */
  currentStage: number;
  /** Whether the game is active */
  isGameActive: boolean;
}

/**
 * StageProgressBar component
 * A horizontal bar that represents the time remaining in the current completion stage
 * Drains from right-to-left as time progresses
 */
export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  ratio,
  currentStage,
  isGameActive
}) => {
  return (
    <ProgressBarContainer>
      <ProgressBarFill $ratio={ratio} $stage={currentStage} />
    </ProgressBarContainer>
  );
};

export default StageProgressBar; 