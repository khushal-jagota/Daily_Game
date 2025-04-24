import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import styled from 'styled-components';
import { Lightbulb, Timer } from 'lucide-react';

// Define the props interface for the StartupModal component
interface StartupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStartGame: () => void; // Made required
  themeName?: string;
}

// Define the mini grid data (null = no cell, string = letter)
const miniGrid = [
  [null, 'H', null, null, null],
  [null, 'A', null, null, null],
  ['E', 'V', 'E', 'R', 'Y'], // Row index 2
  [null, 'E', null, null, null]
  // Col index 1
];

// Styled components for the modal
const StyledOverlay = styled(Dialog.Overlay)`
  background-color: rgba(0, 0, 0, 0.7);
  position: fixed;
  inset: 0;
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes overlayShow {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const StyledContent = styled(Dialog.Content)`
  background-color: ${({ theme }) => theme.gridBackground || '#121212'};
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 500px;
  max-height: 90vh;
  padding: 32px;
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
  color: ${({ theme }) => theme.textColor || '#EAEAEA'};
  display: flex;
  flex-direction: column;
  gap: 24px;

  @keyframes contentShow {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  &:focus {
    outline: none;
  }
`;

const ModalHeader = styled(Dialog.Title)`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  color: ${({ theme }) => theme.textColor || '#ffffff'};
`;

const ThemeText = styled(Dialog.Description)`
  margin: 0;
  font-size: 18px;
  text-align: center;
  color: ${({ theme }) => theme.numberColor || '#BBBBBB'};
  font-weight: 500;
`;

// Mini Grid styled components
const MiniGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 16px 0;
`;

const MiniGridRow = styled.div`
  display: flex;
`;

// MiniGridCell: Updated for column/row animation
const MiniGridCell = styled.div<{
  $isEmpty: boolean;
  $animateCol?: boolean; // Animation trigger for the target column
  $animateRow?: boolean; // Animation trigger for the target row
}>`
  width: 40px;
  height: 40px;
  border: ${({ $isEmpty, theme }) => $isEmpty ? 'none' : `1px solid ${theme.cellBorder || '#444'}`};
  background-color: ${({ $isEmpty, theme }) => $isEmpty ? 'transparent' : theme.highlightBackground || '#1E1E1E'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2px;

  /* --- Animation Styles --- */
  transition-property: background-color;
  transition-duration: 0.6s;
  transition-timing-function: ease-in-out;
  /* No delay needed, timing via state */

  /* Apply target color if cell is in target column/row AND animation is active */
  ${({ $animateCol, $animateRow, $isEmpty, theme }) =>
    !$isEmpty && ($animateCol || $animateRow) && `
      background-color: ${
        $animateRow 
          ? theme.completionStage4Background || '#FFC107' // Yellow for row (EVERY)
          : theme.correctColor || '#4CAF50' // Green for column (HAVE)
      };
    `}
`;

// MiniGridLetter: Simplified without animation props
const MiniGridLetter = styled.span`
  color: ${({ theme }) => theme.textColor || '#FFFFFF'};
  font-size: 20px;
  font-weight: 600;
`;

const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 8px 0;
`;

const InstructionBox = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px;
  background-color: ${({ theme }) => theme.focusBackground || '#1E1E1E'};
  border-radius: 8px;
`;

const InstructionIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.highlightBackground || '#2D2D2D'};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.textColor || '#EAEAEA'}; /* Added for icon color */
`;

const InstructionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InstructionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.textColor || '#ffffff'};
`;

const InstructionText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: ${({ theme }) => theme.numberColor || '#BBBBBB'};
`;

const PlayButton = styled.button`
  background-color: ${({ theme }) => theme.correctColor || '#4CAF50'};
  color: white;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 8px auto 0;
  display: block;
  width: 100%;
  max-width: 200px;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: ${({ theme }) => theme.completionStage2Background || '#45a049'};
  }

  &:focus {
    outline: none;
    box-shadow: ${({ theme }) => `0 0 0 3px ${theme.correctColor ? `${theme.correctColor}4D` : 'rgba(76, 175, 80, 0.3)'}`};
  }
`;

// Handle reduced motion preference
const ReducedMotionStyles = styled.div`
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
    }
  }
`;

/**
 * StartupModal - An animated modal displayed when the game starts
 * Shows the game title, theme, and instructions before gameplay begins
 */
const StartupModal: React.FC<StartupModalProps> = ({
  isOpen,
  onOpenChange,
  onStartGame,
  themeName = 'Daily Puzzle'
}) => {
  // State for column/row animations
  const [animateCol2, setAnimateCol2] = useState(false); // For Column index 1
  const [animateRow3, setAnimateRow3] = useState(false); // For Row index 2
  
  // Reset and trigger animation when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset animation states
      setAnimateCol2(false);
      setAnimateRow3(false);

      // Trigger Column 2 animation after a longer initial delay
      const timerCol = setTimeout(() => {
        setAnimateCol2(true);
      }, 1200); // Increased from 500ms to 1200ms for initial delay

      // Trigger Row 3 animation with a larger gap after Column 2 starts
      const timerRow = setTimeout(() => {
        setAnimateRow3(true);
      }, 2500); // Increased from 900ms to 2000ms for a larger gap between animations
      
      // Clean up timeout if modal closes before animation completes
      return () => {
        clearTimeout(timerCol);
        clearTimeout(timerRow);
      };
    }
  }, [isOpen]);

  // Simplified to only call onStartGame (parent handles closing modal and starting game)
  const handlePlayClick = () => {
    onStartGame();
  };

  // Keyboard handler for accessibility - allow Enter or Space to trigger Play button
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlayClick();
    }
  };

  // Render the mini grid with column/row animation logic
  const renderMiniGrid = () => {
    const targetColIndex = 1; // Column 2
    const targetRowIndex = 2; // Row 3

    return (
      <MiniGridContainer>
        {miniGrid.map((row, rowIndex) => (
          <MiniGridRow key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => {
              // Determine if this cell should participate in animations
              const isTargetCol = cellIndex === targetColIndex;
              const isTargetRow = rowIndex === targetRowIndex;

              return (
                <MiniGridCell
                  key={`cell-${rowIndex}-${cellIndex}`}
                  $isEmpty={cell === null}
                  // Pass animation triggers if cell is in the target column/row
                  $animateCol={isTargetCol ? animateCol2 : false}
                  $animateRow={isTargetRow ? animateRow3 : false}
                >
                  {cell && (
                    <MiniGridLetter aria-hidden="true">
                      {cell}
                    </MiniGridLetter>
                  )}
                </MiniGridCell>
              );
            })}
          </MiniGridRow>
        ))}
      </MiniGridContainer>
    );
  };

  return (
    <>
      <ReducedMotionStyles />
      <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <StyledOverlay />
          <StyledContent 
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            onKeyDown={handleKeyDown}
          >
            <ModalHeader id="modal-title">Daily Game</ModalHeader>
            <ThemeText id="modal-description">Today's Theme - {themeName}</ThemeText>
            
            {renderMiniGrid()}
            
            <InstructionsContainer>
              <InstructionBox>
                <InstructionIconWrapper>
                  <Lightbulb size={22} aria-hidden="true" />
                </InstructionIconWrapper>
                <InstructionContent>
                  <InstructionTitle>Solve the Crossword</InstructionTitle>
                  <InstructionText>
                    Fill in all words correctly to complete the puzzle. All clues are related to today's theme.
                  </InstructionText>
                </InstructionContent>
              </InstructionBox>
              
              <InstructionBox>
                <InstructionIconWrapper>
                  <Timer size={22} aria-hidden="true" />
                </InstructionIconWrapper>
                <InstructionContent>
                  <InstructionTitle>Beat the Clock</InstructionTitle>
                  <InstructionText>
                    The faster you solve, the better your final color. Watch the timer and aim for the best score!
                  </InstructionText>
                </InstructionContent>
              </InstructionBox>
            </InstructionsContainer>
            
            <PlayButton 
              onClick={handlePlayClick}
              aria-label="Start the game"
              autoFocus // Automatically focus the button when modal opens
            >
              Let's Play!
            </PlayButton>
          </StyledContent>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default StartupModal; 