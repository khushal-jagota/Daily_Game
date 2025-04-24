import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import styled from 'styled-components';
import { Timer } from 'lucide-react';

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
  z-index: 50; /* Ensure overlay is above other content */

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
  z-index: 51; /* Ensure content is above overlay */

  /* --- Responsive Sizing & Viewport Units --- */
  width: 90vw;
  max-width: 31.25rem; /* 500px -> rem for consistency */
  max-height: 90vh; /* Fallback */
  max-height: 90svh; /* Use smallest viewport height to avoid jumps */
  /* Removed overflow-y: auto to adhere to "no-scroll" */

  /* --- Flexible Padding & Safe Area Handling --- */
  padding: clamp(1rem, 2vw + 1rem, 2rem); /* Responsive padding */
  /* Incorporate safe area insets using CSS variables (adjust var names if needed) */
  padding-top: calc(clamp(1rem, 2vw + 1rem, 2rem) + var(--safe-area-inset-top, 0px));
  padding-bottom: calc(clamp(1rem, 2vw + 1rem, 2rem) + var(--safe-area-inset-bottom, 0px));
  padding-left: calc(clamp(1rem, 2vw + 1rem, 2rem) + var(--safe-area-inset-left, 0px));
  padding-right: calc(clamp(1rem, 2vw + 1rem, 2rem) + var(--safe-area-inset-right, 0px));


  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
  color: ${({ theme }) => theme.textColor || '#EAEAEA'};
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 1.5vw + 0.5rem, 1.5rem); /* Responsive gap */

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
  /* --- Flexible Font Size --- */
  font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem); /* Approx 24px min, 32px max */
  font-weight: 700;
  text-align: center;
  color: ${({ theme }) => theme.textColor || '#ffffff'};
  line-height: 1.2;
`;

const ThemeText = styled(Dialog.Description)`
  margin: 0;
  /* --- Flexible Font Size --- */
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem); /* Approx 16px min, 18px max */
  text-align: center;
  color: ${({ theme }) => theme.numberColor || '#BBBBBB'};
  font-weight: 500;
`;

// Mini Grid styled components
const MiniGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Responsive margin */
  margin: clamp(0.5rem, 1vw + 0.25rem, 1rem) 0;
`;

const MiniGridRow = styled.div`
  display: flex;
`;

// MiniGridCell: Updated for responsiveness and column/row animation
const MiniGridCell = styled.div<{
  $isEmpty: boolean;
  $animateCol?: boolean;
  $animateRow?: boolean;
}>`
  /* --- Flexible Size using clamp --- */
  width: clamp(1.8rem, 5vw, 2.5rem); /* Approx 29px to 40px, scales with viewport */
  height: clamp(1.8rem, 5vw, 2.5rem); /* Maintain square aspect ratio */
  
  border: ${({ $isEmpty, theme }) => $isEmpty ? 'none' : `1px solid ${theme.cellBorder || '#444'}`};
  background-color: ${({ $isEmpty, theme }) => $isEmpty ? 'transparent' : theme.highlightBackground || '#1E1E1E'};
  display: flex;
  align-items: center;
  justify-content: center;
  /* Responsive margin */
  margin: clamp(0.1rem, 0.5vw, 0.125rem); /* Approx 1.6px to 2px */

  transition-property: background-color;
  transition-duration: 0.6s;
  transition-timing-function: ease-in-out;

  ${({ $animateCol, $animateRow, $isEmpty, theme }) =>
    !$isEmpty && ($animateCol || $animateRow) && `
      background-color: ${
        $animateRow
          ? theme.completionStage4Background || '#FFC107' // Yellow for row (EVERY)
          : theme.correctColor || '#4CAF50' // Green for column (HAVE)
      };
    `}
`;

// MiniGridLetter: Updated for responsiveness
const MiniGridLetter = styled.span`
  color: ${({ theme }) => theme.textColor || '#FFFFFF'};
  /* --- Flexible Font Size --- */
  font-size: clamp(1rem, 0.8rem + 1vw, 1.25rem); /* Approx 16px to 20px, scales with cell */
  font-weight: 600;
  line-height: 1; /* Ensure letter stays centered */
`;

const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* Responsive gap */
  gap: clamp(0.75rem, 1vw + 0.5rem, 1rem); /* Approx 12px to 16px */
  margin: clamp(0.25rem, 0.5vw + 0.1rem, 0.5rem) 0; /* Smaller vertical margin */
`;

const InstructionBox = styled.div`
  display: flex;
  /* Responsive gap */
  gap: clamp(0.75rem, 1vw + 0.5rem, 1rem); /* Approx 12px to 16px */
  align-items: flex-start;
  /* Responsive padding */
  padding: clamp(0.75rem, 1.5vw + 0.5rem, 1rem); /* Approx 12px to 16px */
  background-color: ${({ theme }) => theme.focusBackground || '#1E1E1E'};
  border-radius: 8px;
`;

const InstructionIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.highlightBackground || '#2D2D2D'};
  border-radius: 50%;
  /* Use rem for fixed-size elements related to font/icon size */
  width: 2.5rem; /* 40px */
  height: 2.5rem; /* 40px */
  flex-shrink: 0;
  color: ${({ theme }) => theme.textColor || '#EAEAEA'};
`;

const InstructionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem; /* 4px */
`;

const InstructionTitle = styled.h3`
  margin: 0;
  /* --- Flexible Font Size --- */
  font-size: clamp(0.9rem, 0.85rem + 0.25vw, 1rem); /* Approx 14.4px min, 16px max */
  font-weight: 600;
  color: ${({ theme }) => theme.textColor || '#ffffff'};
`;

const InstructionText = styled.p`
  margin: 0;
  /* --- Flexible Font Size --- */
  font-size: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem); /* Approx 12.8px min, 14px max */
  line-height: 1.4;
  color: ${({ theme }) => theme.numberColor || '#BBBBBB'};
`;

const PlayButton = styled.button`
  background-color: ${({ theme }) => theme.correctColor || '#4CAF50'};
  color: white;
  /* --- Flexible Padding & Font Size --- */
  padding: clamp(0.6rem, 1vw + 0.4rem, 0.75rem) clamp(1.2rem, 2vw + 0.8rem, 1.5rem); /* Vert/Horiz padding */
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem); /* Approx 16px min, 18px max */
  
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  /* Responsive margin */
  margin: clamp(0.5rem, 1vw + 0.25rem, 1rem) auto 0;
  display: block;
  width: 100%;
  max-width: 12.5rem; /* 200px -> rem */
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
 * Updated with responsive sizing, modern CSS units, and safe area handling.
 */
const StartupModal: React.FC<StartupModalProps> = ({
  isOpen,
  onOpenChange,
  onStartGame,
  themeName = 'Daily Puzzle'
}) => {
  const [animateCol2, setAnimateCol2] = useState(false);
  const [animateRow3, setAnimateRow3] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimateCol2(false);
      setAnimateRow3(false);
      const timerCol = setTimeout(() => setAnimateCol2(true), 1200);
      const timerRow = setTimeout(() => setAnimateRow3(true), 2500);
      return () => {
        clearTimeout(timerCol);
        clearTimeout(timerRow);
      };
    }
  }, [isOpen]);

  const handlePlayClick = () => {
    onStartGame();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlayClick();
    }
  };

  const renderMiniGrid = () => {
    const targetColIndex = 1;
    const targetRowIndex = 2;
    return (
      <MiniGridContainer>
        {miniGrid.map((row, rowIndex) => (
          <MiniGridRow key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => {
              const isTargetCol = cellIndex === targetColIndex;
              const isTargetRow = rowIndex === targetRowIndex;
              return (
                <MiniGridCell
                  key={`cell-${rowIndex}-${cellIndex}`}
                  $isEmpty={cell === null}
                  $animateCol={isTargetCol ? animateCol2 : false}
                  $animateRow={isTargetRow ? animateRow3 : false}
                >
                  {cell && (
                    <MiniGridLetter aria-hidden="true">{cell}</MiniGridLetter>
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
              autoFocus // Keep autoFocus for accessibility
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