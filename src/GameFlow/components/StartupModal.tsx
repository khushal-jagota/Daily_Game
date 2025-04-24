import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import styled, { css } from 'styled-components';
import { Timer } from 'lucide-react';

// --- Interfaces and Constants ---

interface StartupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStartGame: () => void;
  themeName?: string;
}

const miniGrid = [
  [null, 'H', null, null, null],
  [null, 'A', null, null, null],
  ['E', 'V', 'E', 'R', 'Y'],
  [null, 'E', null, null, null]
];

// --- Animation Keyframes ---

const overlayShow = css`
  @keyframes overlayShow {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const contentShow = css`
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
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
`;

// --- Styled Components ---

const StyledOverlay = styled(Dialog.Overlay)`
  background-color: rgba(0, 0, 0, 0.7);
  position: fixed;
  inset: 0;
  z-index: 40; /* Ensure overlay is below content */
  ${overlayShow}
`;

const StyledContent = styled(Dialog.Content)`
  background-color: ${({ theme }) => theme.gridBackground || '#121212'};
  color: ${({ theme }) => theme.textColor || '#EAEAEA'};
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50; /* Ensure content is above overlay */

  /* --- Sizing --- */
  width: clamp(280px, 90vw, 500px);
  min-height: 70vh;  /* Fallback */
  min-height: 70svh; /* Target Minimum Height */
  min-height: 70dvh;
  max-height: 90vh;  /* Fallback */
  max-height: 90svh; /* Target Maximum Height */
  max-height: 90dvh;

  /* --- Layout --- */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Distribute space vertically */
  gap: clamp(0.75rem, 2vh, 1.25rem); /* Moderate gap for elements not pushed apart by space-between */

  /* --- Padding & Safe Area --- */
  /* Use clamp for responsive padding */
  padding: clamp(1.25rem, 4vw, 2rem); /* Slightly adjusted padding */
  /* Add safe area insets */
  padding-top: calc(clamp(1.25rem, 4vw, 2rem) + env(safe-area-inset-top, 0px));
  padding-bottom: calc(clamp(1.25rem, 4vw, 2rem) + env(safe-area-inset-bottom, 0px));
  padding-left: calc(clamp(1.25rem, 4vw, 2rem) + env(safe-area-inset-left, 0px));
  padding-right: calc(clamp(1.25rem, 4vw, 2rem) + env(safe-area-inset-right, 0px));

  /* --- Overflow & Animation --- */
  overflow: hidden; /* Enforce no-scroll policy */
  ${contentShow}

  &:focus {
    outline: none;
  }
`;

const ModalHeader = styled(Dialog.Title)`
  margin: 0;
  font-size: clamp(1.7rem, 5vw, 2.2rem); /* Responsive font size */
  font-weight: 700;
  text-align: center;
  color: ${({ theme }) => theme.textColor || '#ffffff'};
  flex-shrink: 0;
`;

const ThemeText = styled(Dialog.Description)`
  margin: 0;
  font-size: clamp(1rem, 3vw, 1.125rem); /* Responsive font size */
  text-align: center;
  color: ${({ theme }) => theme.numberColor || '#BBBBBB'};
  font-weight: 500;
  flex-shrink: 0;
`;

// --- Mini Grid (Restored Larger Size) ---
const MiniGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: clamp(0.25rem, 1vh, 0.5rem) 0; /* Small vertical margin if needed */
  flex-shrink: 0;
`;

const MiniGridRow = styled.div`
  display: flex;
`;

const MiniGridCell = styled.div<{
  $isEmpty: boolean;
  $animateCol?: boolean;
  $animateRow?: boolean;
}>`
  /* Larger responsive size using rem and clamp */
  width: clamp(2.25rem, 7vw, 3rem);  /* ~36px to 48px - closer to original 40px */
  height: clamp(2.25rem, 7vw, 3rem);
  /* Responsive margin */
  margin: clamp(0.125rem, 0.6vw, 0.2rem); /* ~2px to 3.2px */

  border: ${({ $isEmpty, theme }) => $isEmpty ? 'none' : `1px solid ${theme.cellBorder || '#444'}`};
  background-color: ${({ $isEmpty, theme }) => $isEmpty ? 'transparent' : theme.highlightBackground || '#1E1E1E'};
  border-radius: 3px; /* Subtle rounding */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.6s ease-in-out;

  ${({ $animateCol, $animateRow, $isEmpty, theme }) =>
    !$isEmpty && ($animateCol || $animateRow) && `
      background-color: ${
        $animateRow
          ? theme.completionStage4Background || '#FFC107'
          : theme.correctColor || '#4CAF50'
      };
    `}
`;

const MiniGridLetter = styled.span`
  color: ${({ theme }) => theme.textColor || '#FFFFFF'};
  /* Larger responsive font size relative to cell size */
  font-size: clamp(1.125rem, 4vw, 1.5rem); /* ~18px to 24px - closer to original 20px */
  font-weight: 600;
  user-select: none;
`;

// --- Instructions ---
const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vh, 1rem); /* Gap between instruction boxes if multiple */
  margin: clamp(0.25rem, 1vh, 0.5rem) 0; /* Small vertical margin if needed */
  flex-shrink: 0; /* Prevent shrinking */
  /* Remove flex-grow and overflow-y */
`;

const InstructionBox = styled.div`
  display: flex;
  gap: clamp(0.75rem, 3vw, 1rem);
  align-items: flex-start;
  padding: clamp(0.75rem, 3vw, 1rem);
  background-color: ${({ theme }) => theme.focusBackground || '#1E1E1E'};
  border-radius: 8px;
`;

const InstructionIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.highlightBackground || '#2D2D2D'};
  border-radius: 50%;
  width: clamp(2rem, 8vw, 2.5rem); /* Responsive size */
  height: clamp(2rem, 8vw, 2.5rem);
  flex-shrink: 0;
  color: ${({ theme }) => theme.textColor || '#EAEAEA'};

  svg {
    width: clamp(1.1rem, 4vw, 1.375rem);
    height: clamp(1.1rem, 4vw, 1.375rem);
  }
`;

const InstructionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(0.15rem, 1vh, 0.25rem);
`;

const InstructionTitle = styled.h3`
  margin: 0;
  font-size: clamp(0.9rem, 2.5vw, 1rem); /* Responsive font size */
  font-weight: 600;
  color: ${({ theme }) => theme.textColor || '#ffffff'};
`;

const InstructionText = styled.p`
  margin: 0;
  font-size: clamp(0.8rem, 2.2vw, 0.875rem); /* Responsive font size */
  line-height: 1.4;
  color: ${({ theme }) => theme.numberColor || '#BBBBBB'};
`;

// --- Play Button ---
const PlayButton = styled.button`
  background-color: ${({ theme }) => theme.correctColor || '#4CAF50'};
  color: white;
  padding: clamp(0.6rem, 2.5vh, 0.75rem) clamp(1.2rem, 5vw, 1.5rem);
  font-size: clamp(1rem, 3.5vw, 1.125rem);
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 0 auto; /* Center horizontally, rely on space-between for vertical */
  display: block;
  width: 100%;
  max-width: clamp(150px, 50vw, 200px);
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;

  &:hover {
    background-color: ${({ theme }) => theme.completionStage2Background || '#45a049'};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => `0 0 0 3px ${theme.gridBackground || '#121212'}, 0 0 0 5px ${theme.correctColor || '#4CAF50'}`};
  }
`;

// --- Reduced Motion ---
const ReducedMotionStyles = styled.div`
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { /* Apply more broadly */
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
      scroll-behavior: auto !important; /* Add scroll behavior */
    }
    ${StyledOverlay}, ${StyledContent} {
       animation: none;
    }
    ${MiniGridCell} {
        transition: none;
    }
  }
`;

// --- Component Implementation (Unchanged Logic) ---

const StartupModal: React.FC<StartupModalProps> = ({
  isOpen,
  onOpenChange,
  onStartGame,
  themeName = 'Daily Puzzle'
}) => {
  const [animateCol2, setAnimateCol2] = useState(false);
  const [animateRow3, setAnimateRow3] = useState(false);
  useEffect(() => {
    let timerCol: ReturnType<typeof setTimeout> | undefined;
    let timerRow: ReturnType<typeof setTimeout> | undefined;

    if (isOpen) {
      setAnimateCol2(false);
      setAnimateRow3(false);

      requestAnimationFrame(() => {
        timerCol = setTimeout(() => setAnimateCol2(true), 1200);
        timerRow = setTimeout(() => setAnimateRow3(true), 2500);
      });

    } else {
       clearTimeout(timerCol);
       clearTimeout(timerRow);
    }

    return () => {
      clearTimeout(timerCol);
      clearTimeout(timerRow);
    };
  }, [isOpen]);

  const handlePlayClick = () => {
    onStartGame();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Escape key to close the modal via Radix default behavior
    if (e.key === 'Enter' || e.key === ' ') {
        // Only trigger play if the button itself isn't focused (avoid double trigger)
        if (document.activeElement !== e.currentTarget.querySelector('button')) {
            e.preventDefault();
            handlePlayClick();
        }
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
            aria-describedby="theme-description instruction-title" // Describe by theme and first instruction title
            onKeyDown={handleKeyDown} // Keep keydown on content for global Enter/Space
          >
            <ModalHeader id="modal-title">Daily Game</ModalHeader>
            <ThemeText id="theme-description">Today's Theme - {themeName}</ThemeText>

            {renderMiniGrid()}

            <InstructionsContainer>
              <InstructionBox>
                <InstructionIconWrapper>
                  <Timer aria-hidden="true" />
                </InstructionIconWrapper>
                <InstructionContent>
                  {/* Add id for aria-describedby */}
                  <InstructionTitle id="instruction-title">Beat the Clock</InstructionTitle>
                  <InstructionText>
                    The faster you solve, the better your final color. Watch the timer and aim for the best score!
                  </InstructionText>
                </InstructionContent>
              </InstructionBox>
              {/* Add more InstructionBoxes here if needed */}
            </InstructionsContainer>

            <PlayButton
              onClick={handlePlayClick}
              aria-label="Start the game"
              autoFocus
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