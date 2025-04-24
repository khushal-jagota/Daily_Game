import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import styled, { css } from 'styled-components';
import { Timer } from 'lucide-react';

// --- Configuration & Constants ---

interface StartupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStartGame: () => void;
  themeName?: string;
}

// Define theme colors (Ideally from theme provider)
const lightPurple = '#9D59EF'; // For button gradient start, focus rings
const lightPurpleGradientEnd = '#8A2BE2'; // Darker shade for button gradient end/hover
const infoBoxBackground = '#2D2B33'; // Info box background color
const iconWrapperBackground = '#3C3842'; // Icon circle background within info box

const defaultTextColor = '#EAEAEA'; // Standard text color
const headerTextColor = '#FFFFFF'; // Explicit white for header
const subtleTextColor = '#BBBBBB'; // For theme text, instruction details
const gridBackgroundColor = '#121212'; // Modal background
const cellBackgroundColor = '#1E1E1E'; // Default cell bg
const cellBorderColor = '#444'; // Default cell border
const highlightColorGreen = '#4CAF50'; // Grid animation color
const highlightColorYellow = '#FFC107'; // Grid animation color

const miniGrid = [
  [null, 'H', null, null, null],
  [null, 'A', null, null, null],
  ['E', 'V', 'E', 'R', 'Y'],
  [null, 'E', null, null, null]
];

// --- Animation Keyframes ---

const overlayShow = css`
  @keyframes overlayShow { from { opacity: 0; } to { opacity: 1; } }
  animation: overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const contentShow = css`
  @keyframes contentShow {
    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
`;

// --- Styled Components ---

const StyledOverlay = styled(Dialog.Overlay)`
  background-color: rgba(0, 0, 0, 0.75);
  position: fixed;
  inset: 0;
  z-index: 40;
  ${overlayShow}
`;

const StyledContent = styled(Dialog.Content)`
  background-color: ${({ theme }) => theme.gridBackground || gridBackgroundColor};
  color: ${({ theme }) => theme.textColor || defaultTextColor};
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;

  /* Sizing */
  width: clamp(300px, 90vw, 520px);
  min-height: 70vh;  /* Fallback */
  min-height: 70svh; /* Target Minimum Height */
  min-height: 70dvh;
  max-height: 90vh;  /* Fallback */
  max-height: 90svh; /* Target Maximum Height */
  max-height: 90dvh;

  /* Layout */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(1rem, 2.5vh, 1.75rem);

  /* Padding & Safe Area */
  padding: clamp(1.5rem, 5vw, 2.5rem);
  padding-top: calc(clamp(1.5rem, 5vw, 2.5rem) + env(safe-area-inset-top, 0px));
  padding-bottom: calc(clamp(1.5rem, 5vw, 2.5rem) + env(safe-area-inset-bottom, 0px));
  padding-left: calc(clamp(1.5rem, 5vw, 2.5rem) + env(safe-area-inset-left, 0px));
  padding-right: calc(clamp(1.5rem, 5vw, 2.5rem) + env(safe-area-inset-right, 0px));

  overflow: hidden;
  ${contentShow}

  &:focus { outline: none; }
`;

// --- Header Section ---
const HeaderGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.25rem, 1vh, 0.5rem); /* Tight gap */
  flex-shrink: 0;
`;

const ModalHeader = styled(Dialog.Title)`
  margin: 0;
  font-size: clamp(1.8rem, 5.5vw, 2.4rem);
  font-weight: 700;
  text-align: center;
  color: ${({ theme }) => theme.headerTextColor || headerTextColor}; /* White Title */
`;

const ThemeText = styled(Dialog.Description)`
  margin: 0;
  font-size: clamp(1rem, 3vw, 1.15rem);
  text-align: center;
  color: ${({ theme }) => theme.subtleTextColor || subtleTextColor};
  font-weight: 500;
`;

// --- Mini Grid ---
// (No changes to Mini Grid styles in this iteration)
const MiniGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  flex-shrink: 0;
`;
const MiniGridRow = styled.div` display: flex; `;
const MiniGridCell = styled.div<{ $isEmpty: boolean; $animateCol?: boolean; $animateRow?: boolean; }>`
  width: clamp(2.3rem, 7.5vw, 3.1rem);
  height: clamp(2.3rem, 7.5vw, 3.1rem);
  margin: clamp(0.13rem, 0.7vw, 0.22rem);
  border: 1px solid ${({ $isEmpty, theme }) => $isEmpty ? 'transparent' : (theme.cellBorder || cellBorderColor)};
  background-color: ${({ $isEmpty, theme }) => $isEmpty ? 'transparent' : (theme.cellBackground || cellBackgroundColor)};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.6s ease-in-out;
  ${({ $animateCol, $animateRow, $isEmpty, theme }) => !$isEmpty && ($animateCol || $animateRow) && css`
    background-color: ${$animateRow ? (theme.highlightYellow || highlightColorYellow) : (theme.highlightGreen || highlightColorGreen)};
    border-color: transparent;
  `}
`;
const MiniGridLetter = styled.span`
  color: ${({ theme }) => theme.textColor || defaultTextColor};
  font-size: clamp(1.2rem, 4.2vw, 1.6rem);
  font-weight: 600;
  user-select: none;
`;

// --- Instructions ---
const InstructionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2vh, 1rem);
  margin: 0;
  flex-shrink: 0;
`;

// Reverted InstructionBox to the simpler dark style
const InstructionBox = styled.div`
  display: flex;
  gap: clamp(0.8rem, 3vw, 1.1rem);
  align-items: center;
  padding: clamp(0.8rem, 3vw, 1.2rem);
  background-color: ${({ theme }) => theme.infoBoxBackground || infoBoxBackground}; /* Dark Background */
  border-radius: 10px;
  /* No border */
`;

// Reverted InstructionIconWrapper
const InstructionIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.iconWrapperBackground || iconWrapperBackground}; /* Slightly Lighter Circle BG */
  border-radius: 50%;
  width: clamp(2.1rem, 8vw, 2.6rem);
  height: clamp(2.1rem, 8vw, 2.6rem);
  flex-shrink: 0;
  color: ${({ theme }) => theme.textColor || defaultTextColor}; /* Icon color (e.g., white) */

  svg {
    width: clamp(1.15rem, 4vw, 1.4rem);
    height: clamp(1.15rem, 4vw, 1.4rem);
  }
`;

const InstructionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(0.2rem, 1vh, 0.3rem);
`;

const InstructionTitle = styled.h3`
  margin: 0;
  font-size: clamp(0.95rem, 2.6vw, 1.05rem);
  font-weight: 600;
  color: ${({ theme }) => theme.textColor || defaultTextColor}; /* White Text */
`;

const InstructionText = styled.p`
  margin: 0;
  font-size: clamp(0.8rem, 2.3vw, 0.9rem);
  line-height: 1.45;
  color: ${({ theme }) => theme.subtleTextColor || subtleTextColor}; /* Subtle Text */
`;

// --- Play Button ---
// Apply the Light Purple Gradient style HERE
const PlayButton = styled.button`
  background-image: linear-gradient(
    180deg, /* Top to Bottom */
    ${({ theme }) => theme.buttonLightPurpleStart || lightPurple} 0%,
    ${({ theme }) => theme.buttonLightPurpleEnd || lightPurpleGradientEnd} 100%
  );
  color: ${headerTextColor}; /* Ensure White Text */
  padding: clamp(0.75rem, 3.2vh, 1rem) clamp(1.5rem, 6vw, 2rem);
  font-size: clamp(1.1rem, 4vw, 1.3rem);
  font-weight: 700;
  letter-spacing: 0.5px;
  border: none; /* No border */
  border-radius: 12px;
  cursor: pointer;
  margin: 0 auto;
  display: block;
  width: 100%;
  max-width: clamp(190px, 60vw, 260px);
  transition: filter 0.2s ease, transform 0.1s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;

  &:hover {
     filter: brightness(0.9);
  }
  &:active {
     transform: scale(0.97);
     filter: brightness(0.85);
     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => `0 0 0 3px ${theme.gridBackground || gridBackgroundColor}, 0 0 0 5px ${theme.buttonLightPurpleStart || lightPurple}`}; /* Use light purple for focus */
  }
`;

// --- Reduced Motion ---
const ReducedMotionStyles = styled.div`
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
      scroll-behavior: auto !important;
    }
    ${StyledOverlay}, ${StyledContent} { animation: none; }
    ${MiniGridCell} { transition: none; }
    ${PlayButton} { transition: none; &:active { transform: none; } filter: none !important; }
  }
`;

// --- Component Implementation (Logic Unchanged) ---

const StartupModal: React.FC<StartupModalProps> = ({
  isOpen,
  onOpenChange,
  onStartGame,
  themeName = 'Daily Puzzle'
}) => {
  // ... same state and effects ...
  const [animateCol2, setAnimateCol2] = useState(false);
  const [animateRow3, setAnimateRow3] = useState(false);

  useEffect(() => {
    let timerCol: NodeJS.Timeout | undefined;
    let timerRow: NodeJS.Timeout | undefined;
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

  const handlePlayClick = () => { onStartGame(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
       const playButton = (e.currentTarget as HTMLElement).querySelector<HTMLButtonElement>('button:not([data-radix-focus-guard])');
       if (playButton && document.activeElement !== playButton) {
          e.preventDefault();
          handlePlayClick();
       }
    }
  };

  const renderMiniGrid = () => {
    // ... same grid rendering logic ...
    const targetColIndex = 1;
    const targetRowIndex = 2;
    return (
      <MiniGridContainer>
        {miniGrid.map((row, rowIndex) => (
          <MiniGridRow key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <MiniGridCell
                key={`cell-${rowIndex}-${cellIndex}`}
                $isEmpty={cell === null}
                $animateCol={cellIndex === targetColIndex ? animateCol2 : false}
                $animateRow={rowIndex === targetRowIndex ? animateRow3 : false}
              >
                {cell && <MiniGridLetter aria-hidden="true">{cell}</MiniGridLetter>}
              </MiniGridCell>
            ))}
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
            aria-describedby="theme-description instruction-title"
            onKeyDown={handleKeyDown}
          >
            <HeaderGroup>
              {/* Title is White */}
              <ModalHeader id="modal-title">Daily Game</ModalHeader>
              <ThemeText id="theme-description">Today's Theme - {themeName}</ThemeText>
            </HeaderGroup>

            {renderMiniGrid()}

            <InstructionsContainer>
              {/* Info Box reverted to simpler dark style */}
              <InstructionBox>
                <InstructionIconWrapper>
                  <Timer aria-hidden="true" />
                </InstructionIconWrapper>
                <InstructionContent>
                  <InstructionTitle id="instruction-title">Beat the Clock</InstructionTitle>
                  <InstructionText>
                    The faster you solve, the better your final color. Watch the timer and aim for the best score!
                  </InstructionText>
                </InstructionContent>
              </InstructionBox>
            </InstructionsContainer>

            {/* Button uses Light Purple Gradient */}
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