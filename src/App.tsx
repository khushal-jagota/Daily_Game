import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStateManager } from './GameFlow/state/useGameStateManager'
import { AppWrapper, CrosswordArea, ClueArea, KeyboardArea, TimerBarContainer, KeyboardPlaceholder } from './Layout/components'
import ThemedCrossword from './Crossword/components/ThemedCrossword'
import ClueVisualiser from './Crossword/components/ClueVisualiser'
import styled, { ThemeProvider } from 'styled-components'
import useTimer from './Timer/hooks/useTimer'
import TimerDisplay from './Timer/components/TimerDisplay'
import StageProgressBar from './Timer/components/StageProgressBar'
import { crosswordTheme } from './Crossword/styles/CrosswordStyles'
import { GridTransitionStyles } from './Crossword/styles/GridTransitions'
import { InputRefCallback } from './Crossword/types'
import VirtualKeyboard from './Keyboard/components/VirtualKeyboard'
import ResultModal from './Sharing/components/ResultModal'
import { CanvasData } from './Sharing/types'
import StartupModal from './GameFlow/components/StartupModal'
import { PuzzleProvider, usePuzzleLoader } from './Puzzle/PuzzleProvider'
import { trackLevelStart, trackLevelEnd, trackShareButtonClick } from './Analytics/analytics'

// Styled Start Game button
const StartButton = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin: 20px auto;
  display: block;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #45a049;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
  }
`;

// Initial screen when game hasn't started
const InitialScreen = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  text-align: center;
  background-color: #121212;
`;

const InitialScreenText = styled.p`
  margin-bottom: 20px;
  font-size: 18px;
  color: #EAEAEA;
  max-width: 600px;
`;

// Simple loading indicator for when puzzle data is loading
const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background-color: #121212;
  color: white;
  font-size: 1.5rem;
`;

function App() {
  // Get puzzle data from the PuzzleProvider
  const { loadingState, currentPuzzleMeta, currentPuzzleData, error } = usePuzzleLoader();
  
  // Control game start state
  const [isGameStarted, setIsGameStarted] = useState(false);
  
  // State for modal visibility
  const [isStartupModalOpen, setIsStartupModalOpen] = useState(true);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  
  // Track whether user has clicked "Start Game" but we're still loading (Step 6)
  const [hasInitiatedStart, setHasInitiatedStart] = useState(false);

  // Use the game state manager hook to get the state and actions
  // Now passing the puzzle data from Firebase if available
  const puzzleDataFromFirebase = loadingState === 'success' && currentPuzzleData?.puzzleData ? 
    currentPuzzleData.puzzleData : undefined;
  
  const gameState = useGameStateManager(puzzleDataFromFirebase);
  
  // Ref to track the previous game completion state
  const prevIsGameCompleteRef = useRef<boolean>(gameState.isGameComplete);
  
  // Use timer hook for tracking elapsed time and stage - updated to preserve time when game is complete
  const { elapsedTime, currentStage, stageTimeRemainingRatio } = useTimer({ 
    isGameActive: isGameStarted && !gameState.isGameComplete,
    isGameComplete: isGameStarted && gameState.isGameComplete
  });
  
  // State to hold the input element reference for keyboard integration
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);
  
  // Callback function to receive the input element reference
  const inputRefCallback = useCallback<InputRefCallback>((node) => {
    // Store the input element reference in state
    setInputElement(node);
  }, []);
  
  // Effect to focus the hidden input when selection changes or game starts/resumes
  useEffect(() => {
    // Only focus if the game is active and we have the input element reference
    if (isGameStarted && !gameState.isGameComplete && inputElement) {
      inputElement.focus({ preventScroll: true }); // Use preventScroll to avoid page jumps
    }
    // Dependencies: We want this effect to run whenever the selected cell changes,
    // the input element reference becomes available, or the game start/complete status changes.
  }, [
    gameState.selectedRow, 
    gameState.selectedCol, 
    inputElement, 
    isGameStarted, 
    gameState.isGameComplete 
  ]);
  
  // Effect to open the modal automatically ONLY when the game transitions to complete
  useEffect(() => {
    // Check if the game JUST completed (was false previously, is true now)
    if (!prevIsGameCompleteRef.current && gameState.isGameComplete) {
      setIsResultModalOpen(true);
      
      // Track level end when the game is completed
      if (currentPuzzleMeta?.puzzleNumber) {
        // Convert elapsed time (ms) to seconds for analytics
        const timeInSeconds = Math.floor(elapsedTime / 1000);
        trackLevelEnd(currentPuzzleMeta.puzzleNumber, timeInSeconds);
      }
    }

    // Update the ref AFTER the check for the next render cycle
    prevIsGameCompleteRef.current = gameState.isGameComplete;

  // Only depend on the value that determines the transition
  }, [gameState.isGameComplete, currentPuzzleMeta, elapsedTime]);
  
  // For testing: log the timer values to the console
  useEffect(() => {
    // No console logs needed here
  }, [elapsedTime, currentStage, isGameStarted]);
  
  // Create a wrapper for handleGuessInput that passes the current stage
  const handleGuessInputWrapper = (row: number, col: number, char: string) => {
    gameState.handleGuessInput(row, col, char, currentStage);
  };
  
  // Create an effectiveGameState with the wrapped handler
  const effectiveGameState = {
    ...gameState,
    handleGuessInput: handleGuessInputWrapper
  };
  
  // Derive the active clue text from puzzleData based on current direction and number
  const activeClueText = gameState.currentNumber && gameState.puzzleData?.[gameState.currentDirection]?.[gameState.currentNumber]?.clue || '';
  
  // Start game handler - now with background loading support (Step 6)
  const handleStartGame = () => {
    // User has initiated game start
    setHasInitiatedStart(true);
    
    // If data is already loaded, start immediately
    if (loadingState === 'success') {
      setIsStartupModalOpen(false);
      setIsGameStarted(true);
      
      // Track level start when game begins
      if (currentPuzzleMeta?.puzzleNumber) {
        trackLevelStart(currentPuzzleMeta.puzzleNumber);
      }
    }
    // If data is still loading, the useEffect below will handle navigation once loading completes
  };
  
  // Auto-navigation effect - starts game when data loads after user clicks Start (Step 6)
  useEffect(() => {
    if (loadingState === 'success' && hasInitiatedStart && !isGameStarted) {
      // Data has loaded and user has clicked start, but game hasn't started yet
      setIsStartupModalOpen(false);
      setIsGameStarted(true);
      
      // Track level start when game begins after loading
      if (currentPuzzleMeta?.puzzleNumber) {
        trackLevelStart(currentPuzzleMeta.puzzleNumber);
      }
      
      // Reset hasInitiatedStart to prevent re-triggering
      setHasInitiatedStart(false);
    }
  }, [loadingState, hasInitiatedStart, isGameStarted, currentPuzzleMeta]);

  // Handle virtual keyboard key presses
  const handleVirtualKeyPress = (button: string) => {
    let stateUpdated = false;
    
    // Handle different button types
    if (button === '{bksp}') {
      // Handle backspace key
      gameState.handleBackspace();
      stateUpdated = true;
    } else if (button === '{enter}') {
      // In the future, enter key could trigger word submission or other actions
      // For now, we're not implementing specific functionality for it
    } else {
      // Handle letter keys - check if we have valid selection first
      if (gameState.selectedRow !== null && gameState.selectedCol !== null) {
        gameState.handleGuessInput(gameState.selectedRow, gameState.selectedCol, button.toUpperCase(), currentStage);
        stateUpdated = true;
      }
    }
    
    // If the state was updated, refocus the hidden input element
    if (stateUpdated && inputElement) {
      setTimeout(() => {
        inputElement?.focus({ preventScroll: true });
      }, 0);
    }
  };
  
  // Close modal handler
  const handleCloseResultModal = () => {
    setIsResultModalOpen(false);
  };
  
  // Handle share button click in ResultModal
  const handleShareButtonClick = () => {
    if (currentPuzzleMeta?.puzzleNumber) {
      trackShareButtonClick(currentPuzzleMeta.puzzleNumber);
    }
  };
  
  // Prepare canvas data for the result modal - now with puzzle data from Firebase
  const canvasData: CanvasData = {
    puzzleData: gameState.puzzleData,
    gridData: gameState.gridData,
    completedWords: gameState.completedWords,
    elapsedTime,
    currentStage,
    theme: crosswordTheme,
    puzzleNumber: currentPuzzleMeta?.puzzleNumber?.toString() || "1",
    puzzleThemeName: currentPuzzleData?.themeTitle || "Daily Puzzle"
  };
  
  // Log the canvas data when the game completes to verify all required data is present
  useEffect(() => {
    if (gameState.isGameComplete) {
      console.log('[DataVerification] Canvas data for sharing:', {
        currentStage,
        elapsedTime,
        completedWordsCount: gameState.completedWords.size,
        puzzleNumber: canvasData.puzzleNumber,
        puzzleThemeName: canvasData.puzzleThemeName
      });
    }
  }, [gameState.isGameComplete, currentStage, elapsedTime, gameState.completedWords, canvasData.puzzleNumber, canvasData.puzzleThemeName]);

  // Get the theme name for the startup modal from Firebase data
  const puzzleThemeName = currentPuzzleData?.themeTitle || "Sales";

  // --- Render ---
  return (
    <ThemeProvider theme={crosswordTheme}>
      <GridTransitionStyles />
      <AppWrapper>
        <TimerBarContainer $visible={isGameStarted}>
          <TimerDisplay 
            elapsedTime={elapsedTime} 
            currentStage={currentStage} 
            isVisible={isGameStarted}
          />
          <StageProgressBar
            ratio={stageTimeRemainingRatio}
            currentStage={currentStage}
            isGameActive={isGameStarted && !gameState.isGameComplete}
          />
        </TimerBarContainer>
        {isGameStarted ? (
          <>
            <CrosswordArea>
              <ThemedCrossword 
                gameState={effectiveGameState} 
                onInputRefChange={inputRefCallback}
              />
            </CrosswordArea>
            <ClueArea>
              <ClueVisualiser
                direction={gameState.currentDirection}
                number={gameState.currentNumber}
                clueText={activeClueText}
                onClueClick={gameState.handleMoveToClueStart}
              />
            </ClueArea>
            <KeyboardArea>
              {/* Pass the handler to the VirtualKeyboard */}
              <VirtualKeyboard onKeyPress={handleVirtualKeyPress} />
            </KeyboardArea>
          </>
        ) : (
          /* Use empty div to maintain layout structure when game is not started */
          <div></div>
        )}
        
        {/* Startup Modal - with theme name from Firebase and invisible until loaded */}
        <StartupModal 
          isOpen={isStartupModalOpen}
          onOpenChange={setIsStartupModalOpen}
          onStartGame={handleStartGame}
          themeName={puzzleThemeName}
          isLoading={loadingState === 'loading' || loadingState === 'idle'}
          hasInitiatedStart={hasInitiatedStart}
          errorMessage={loadingState === 'error' ? 'Unable to load puzzle data' : undefined}
        />
        
        {/* Result Modal - now with puzzle number from Firebase */}
        <ResultModal 
          isOpen={isResultModalOpen}
          onClose={handleCloseResultModal}
          canvasData={canvasData}
          onShareButtonClick={handleShareButtonClick}
        />
      </AppWrapper>
    </ThemeProvider>
  );
}

// Wrap the exported App component with the PuzzleProvider
const AppWithProviders = () => (
  <PuzzleProvider>
    <App />
  </PuzzleProvider>
);

export default AppWithProviders;