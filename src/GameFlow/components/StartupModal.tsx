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
  isLoading?: boolean;
  errorMessage?: string;
  hasInitiatedStart?: boolean;
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
const highlightColorGreen = '#4CAF50'; // Grid animation color fallback
const highlightColorYellow = '#FFC107'; // Grid animation color fallback

const miniGrid = [
  [null, 'H', null, null, null],
  [null, 'A', null, null, null],
  ['E', 'V', 'E', 'R', 'Y'],
  [null, 'E', null, null, null]
];

// The fade-in animation duration in ms - defined as constant for consistent reference
const FADE_IN_DURATION = 500;
// Small additional delay before starting grid animations
const ANIMATION_START_DELAY = 150;

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
  color: ${({ theme }) => theme.textColor || headerTextColor}; /* White Title */
`;

// Updated ThemeText component to support fade-in
const ThemeText = styled(Dialog.Description)<{ $visible: boolean }>`
  margin: 0.5rem 0;
  min-height: 1.5rem; /* Maintain consistent vertical spacing */
  font-size: clamp(1rem, 3vw, 1.15rem);
  text-align: center;
  color: ${({ theme }) => theme.numberColor || subtleTextColor};
  font-weight: 500;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity ${FADE_IN_DURATION}ms ease-in-out;
`;

// --- Mini Grid ---
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
    background-color: ${$animateRow 
      ? (theme.completionStage3Background || highlightColorYellow) 
      : (theme.completionStage2Background || highlightColorGreen)};
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
  background-color: ${infoBoxBackground}; /* Dark Background */
  border-radius: 10px;
  /* No border */
`;

// Reverted InstructionIconWrapper
const InstructionIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${iconWrapperBackground}; /* Slightly Lighter Circle BG */
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
  color: ${({ theme }) => theme.numberColor || subtleTextColor}; /* Subtle Text */
`;

// --- Play Button ---
// Apply the Light Purple Gradient style
const PlayButton = styled.button<{ $disabled?: boolean }>`
  background: ${({ $disabled }) => $disabled 
    ? '#666666' // Gray background for disabled state
    : `linear-gradient(to right, ${lightPurple}, ${lightPurpleGradientEnd})`};
  color: white;
  font-size: clamp(1rem, 3.2vw, 1.2rem);
  font-weight: 600;
  width: 100%;
  padding: clamp(0.8rem, 2.5vh, 1.2rem) 0;
  border: none;
  border-radius: 10px;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ $disabled }) => $disabled ? 0.7 : 1}; // Reduce opacity for disabled state
  transition: filter 0.2s ease, opacity 0.2s ease;
  margin-top: auto; /* Push to bottom */
  box-shadow: ${({ $disabled }) => $disabled ? 'none' : '0 3px 10px rgba(138, 43, 226, 0.2)'};
  
  &:hover {
    filter: ${({ $disabled }) => $disabled ? 'none' : 'brightness(1.05)'};
  }
  
  &:focus {
    outline: none;
    box-shadow: ${({ $disabled }) => $disabled 
      ? 'none' 
      : `0 0 0 2px ${lightPurple}, 0 3px 10px rgba(138, 43, 226, 0.3)`};
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

// --- Component Implementation ---

const StartupModal: React.FC<StartupModalProps> = ({
  isOpen,
  onOpenChange,
  onStartGame,
  themeName = 'Daily Puzzle',
  isLoading = false,
  errorMessage,
  hasInitiatedStart
}) => {
  const [animateCol2, setAnimateCol2] = useState(false);
  const [animateRow3, setAnimateRow3] = useState(false);
  // Add state to track when theme title should be visible
  const [themeVisible, setThemeVisible] = useState(!isLoading);
  // Add state to track button click processing
  const [isProcessingClick, setIsProcessingClick] = useState(false);

  // Handle grid animations
  const startGridAnimations = () => {
    // Reset animations first
    setAnimateCol2(false);
    setAnimateRow3(false);
    
    // Start animations with delays
    requestAnimationFrame(() => {
      const colTimer = setTimeout(() => setAnimateCol2(true), 800);
      const rowTimer = setTimeout(() => setAnimateRow3(true), 1600);
      
      return () => {
        clearTimeout(colTimer);
        clearTimeout(rowTimer);
      };
    });
  };

  // Effect for modal open/close
  useEffect(() => {
    if (isOpen && !isLoading) {
      // If already loaded and modal opens, start animations immediately
      startGridAnimations();
    }
    
    // Clean up animations when modal closes or component unmounts
    return () => {
      if (!isOpen) {
        setAnimateCol2(false);
        setAnimateRow3(false);
      }
    };
  }, [isOpen, isLoading]);

  // Effect for theme visibility changes (when loading completes)
  useEffect(() => {
    // Update theme visibility when loading status changes
    setThemeVisible(!isLoading);
    
    // If loading just completed (theme becomes visible), start grid animations after fade-in
    if (!isLoading && isOpen) {
      // Start grid animations after the fade-in animation completes plus a small delay
      const timer = setTimeout(startGridAnimations, FADE_IN_DURATION + ANIMATION_START_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isOpen]);

  const handlePlayClick = () => { 
    // Mark as processing to prevent multiple clicks
    setIsProcessingClick(true);
    
    try {
      // If not in error state
      if (!errorMessage) {
        // Handle normal start logic
        if (!isLoading && !errorMessage) {
          onStartGame(); 
        } else if (isLoading && !hasInitiatedStart) {
          // If still loading and user hasn't initiated start yet, start the background loading
          onStartGame();
        }
      }
    } finally {
      // Reset processing state after a small delay
      setTimeout(() => {
        setIsProcessingClick(false);
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
       const playButton = (e.currentTarget as HTMLElement).querySelector<HTMLButtonElement>('button:not([data-radix-focus-guard])');
       if (playButton && document.activeElement !== playButton) {
         // Don't process if button should be disabled
         if (!isButtonDisabled) {
           if ((!isLoading && !errorMessage) || (isLoading && !hasInitiatedStart)) {
              e.preventDefault();
              handlePlayClick();
           }
         }
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

  // Calculate if button should be disabled
  const isButtonDisabled = !!errorMessage || isProcessingClick;

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
              <ModalHeader id="modal-title">Daily Game</ModalHeader>
              <ThemeText id="theme-description" $visible={themeVisible}>
                {themeName}
              </ThemeText>
            </HeaderGroup>

            {renderMiniGrid()}

            <InstructionsContainer>
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

            <PlayButton
              onClick={handlePlayClick}
              aria-label="Start the game"
              autoFocus
              disabled={isButtonDisabled}
              $disabled={isButtonDisabled}
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