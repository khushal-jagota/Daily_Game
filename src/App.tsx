import { useState, useEffect } from 'react'
import { useGameStateManager } from './GameFlow/state/useGameStateManager'
import { AppWrapper, CrosswordArea, ClueArea, KeyboardArea, TimerBarContainer, KeyboardPlaceholder } from './Layout/components'
import ThemedCrossword from './Crossword/components/ThemedCrossword'
import ClueVisualiser from './Crossword/components/ClueVisualiser'
import styled, { ThemeProvider } from 'styled-components'
import useTimer from './Timer/hooks/useTimer'
import TimerDisplay from './Timer/components/TimerDisplay'
import StageProgressBar from './Timer/components/StageProgressBar'
import { crosswordTheme } from './Crossword/styles/CrosswordStyles'

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

// Debug panel for completedWords
const DebugPanel = styled.div`
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  max-width: 300px;
  max-height: 200px;
  overflow: auto;
  z-index: 1000;
`;

function App() {
  // Control game start state
  const [isGameStarted, setIsGameStarted] = useState(false);

  // Use the game state manager hook to get the state and actions
  const gameState = useGameStateManager();
  (window as any).debugGameState = gameState;
  
  // Use timer hook for tracking elapsed time and stage - updated to preserve time when game is complete
  const { elapsedTime, currentStage, stageTimeRemainingRatio } = useTimer({ 
    isGameActive: isGameStarted && !gameState.isGameComplete,
    isGameComplete: isGameStarted && gameState.isGameComplete
  });
  
  // For testing: log the timer values to the console
  useEffect(() => {
    if (isGameStarted) {
      console.log(`Elapsed time: ${elapsedTime}s, Current stage: ${currentStage}`);
    }
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

  // Prepare completedWords data for display
  const completedWordsDebug = [...gameState.completedWords.entries()].map(
    ([wordId, data]) => `${wordId}: stage=${data.stage}`
  ).join('\n');

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
              <ThemedCrossword gameState={effectiveGameState} />
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
              {/* Keyboard placeholder for testing visibility */}
              <KeyboardPlaceholder aria-hidden="true">Keyboard Placeholder</KeyboardPlaceholder>
            </KeyboardArea>
            
            {/* Debug panel to show completedWords */}
            <DebugPanel>
              <div>
                {gameState.isGameComplete && <span>GAME COMPLETE!</span>}
              </div>
              <div style={{ marginTop: '8px' }}>Completed Words:</div>
              <pre>{completedWordsDebug || '(none)'}</pre>
            </DebugPanel>
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