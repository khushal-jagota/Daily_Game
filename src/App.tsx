import { useState, useEffect, useCallback } from 'react'
import { useGameStateManager } from './GameFlow/state/useGameStateManager'
import { AppWrapper, CrosswordArea, ClueArea, KeyboardArea, TimerBarContainer, KeyboardPlaceholder } from './Layout/components'
import ThemedCrossword from './Crossword/components/ThemedCrossword'
import ClueVisualiser from './Crossword/components/ClueVisualiser'
import styled, { ThemeProvider } from 'styled-components'
import useTimer from './Timer/hooks/useTimer'
import TimerDisplay from './Timer/components/TimerDisplay'
import StageProgressBar from './Timer/components/StageProgressBar'
import { crosswordTheme } from './Crossword/styles/CrosswordStyles'
import { InputRefCallback } from './Crossword/types'
import VirtualKeyboard from './Keyboard/components/VirtualKeyboard'

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
`;

const InitialScreenText = styled.p`
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
  max-width: 600px;
`;

function App() {
  // Control game start state
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Use the game state manager hook to get the state and actions
  const gameState = useGameStateManager();
  
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
  
  // For testing: log the timer values to the console
  useEffect(() => {
    // Removed console log for timer values
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
  
  // Start game handler
  const handleStartGame = () => {
    setIsGameStarted(true);
  };

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

  // --- Render ---
  return (
    <ThemeProvider theme={crosswordTheme}>
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
          <InitialScreen>
            <InitialScreenText>
              Welcome to the Daily Crossword! Click the button below to start the game.
              Your completion time will be tracked and color-coded based on how quickly you solve it.
            </InitialScreenText>
            <StartButton onClick={handleStartGame}>Start Game</StartButton>
          </InitialScreen>
        )}
      </AppWrapper>
    </ThemeProvider>
  );
}

export default App;