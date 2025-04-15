import { useGameStateManager } from './GameFlow/state/useGameStateManager'
import { AppWrapper, Banner, CrosswordArea, ClueArea, KeyboardArea } from './Layout/components'
import ThemedCrossword from './Crossword/components/ThemedCrossword'
import ClueVisualiser from './Crossword/components/ClueVisualiser'

function App() {
  // Use the game state manager hook to get the state and actions
  const gameState = useGameStateManager();
  (window as any).debugGameState = gameState;
  (window as any).debugSetCompletedWords = gameState.setCompletedWords; 
  
  // Derive the active clue text from puzzleData based on current direction and number
  const activeClueText = gameState.currentNumber && gameState.puzzleData?.[gameState.currentDirection]?.[gameState.currentNumber]?.clue || '';
  
  // --- Render ---
  return (
    <AppWrapper>
      <Banner>Daily Crossword</Banner>
      <CrosswordArea>
        <ThemedCrossword gameState={gameState} />
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
        {/* Virtual keyboard may be added in future phases */}
      </KeyboardArea>
    </AppWrapper>
  );
}

export default App;