import { useGameStateManager } from './GameFlow/state/useGameStateManager'
import CrosswordProvider from './Crossword/components/CrosswordCore/CrosswordProvider'
import CrosswordGrid from './Crossword/components/CrosswordCore/CrosswordGrid'
import { ThemeProvider } from 'styled-components'
import { crosswordTheme } from './Crossword/styles/CrosswordStyles'
import { AppWrapper, Banner, CrosswordArea, ClueArea, KeyboardArea } from './Layout/components'
import { useEffect } from 'react'

function App() {
  const { puzzleData, selectedRow, selectedCol, currentDirection, currentNumber } = useGameStateManager();

  useEffect(() => {
    console.log('Focus/Selection State:', { selectedRow, selectedCol, currentDirection, currentNumber });
  }, [selectedRow, selectedCol, currentDirection, currentNumber]);

  return (
    <AppWrapper>
      <Banner>Daily Crossword</Banner>
      <CrosswordArea>
        <ThemeProvider theme={crosswordTheme}>
          <CrosswordProvider data={puzzleData} useStorage={false}>
            <CrosswordGrid />
          </CrosswordProvider>
        </ThemeProvider>
      </CrosswordArea>
      <ClueArea>Current Clue Placeholder</ClueArea>
      <KeyboardArea>Keyboard Placeholder</KeyboardArea>
    </AppWrapper>
  )
}

export default App