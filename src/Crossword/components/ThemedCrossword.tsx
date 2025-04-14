import React, { useCallback, useRef } from 'react';
import { ThemeProvider } from 'styled-components';
import CrosswordProvider from './CrosswordCore/CrosswordProvider';
import CrosswordGrid from './CrosswordCore/CrosswordGrid';
import { crosswordTheme } from '../styles/CrosswordStyles';
import { Direction } from '../types';

// Import the proper imperative handle interface
import { CrosswordProviderImperative } from './CrosswordCore/CrosswordProvider';

// Define the Props interface with expected gameState shape
interface ThemedCrosswordProps {
  gameState: {
    // State
    puzzleData: any;
    selectedRow: number;
    selectedCol: number;
    currentDirection: Direction;
    currentNumber: string;
    // Action handlers
    handleCellSelect: (row: number, col: number) => void;
    handleMoveRequest: (dRow: number, dCol: number) => void;
    handleDirectionToggle: () => void;
    handleMoveToClueStart: (direction: Direction, number: string) => void;
    handleBackspace: () => void;
    handleDelete: () => void;
    handleCharacterEntered: (row: number, col: number) => void;
  };
}

/**
 * Adapter component that connects useGameStateManager state with CrosswordProvider
 * Handles theme application, focus management, and action delegation
 */
const ThemedCrossword: React.FC<ThemedCrosswordProps> = ({ gameState }) => {
  // Create ref for CrosswordProvider to access imperative focus method
  const crosswordProviderRef = useRef<CrosswordProviderImperative>(null);

  // Callback handlers that execute gameState actions and restore focus
  const handleCellSelect = useCallback((row: number, col: number) => {
    gameState.handleCellSelect(row, col);
    // Restore focus after state update
    crosswordProviderRef.current?.focus();
  }, [gameState]);

  const handleMoveRequest = useCallback((dRow: number, dCol: number) => {
    gameState.handleMoveRequest(dRow, dCol);
    crosswordProviderRef.current?.focus();
  }, [gameState]);

  const handleDirectionToggleRequest = useCallback(() => {
    gameState.handleDirectionToggle();
    crosswordProviderRef.current?.focus();
  }, [gameState]);

  const handleMoveToRequest = useCallback((row: number, col: number) => {
    // This is used when internally jumping to a cell (rather than a clue number)
    gameState.handleCellSelect(row, col);
    crosswordProviderRef.current?.focus();
  }, [gameState]);

  const handleBackspaceRequest = useCallback(() => {
    gameState.handleBackspace();
    crosswordProviderRef.current?.focus();
  }, [gameState]);

  const handleDeleteRequest = useCallback(() => {
    gameState.handleDelete();
    crosswordProviderRef.current?.focus();
  }, [gameState]);

  const handleCharacterEnteredRequest = useCallback((row: number, col: number) => {
    gameState.handleCharacterEntered(row, col);
    crosswordProviderRef.current?.focus();
  }, [gameState]);

  return (
    <ThemeProvider theme={crosswordTheme}>
      {gameState.puzzleData && (
        <CrosswordProvider
          ref={crosswordProviderRef}
          data={gameState.puzzleData}
          useStorage={false}
          // Pass selection state from gameState
          selectedRow={gameState.selectedRow}
          selectedCol={gameState.selectedCol}
          currentDirection={gameState.currentDirection}
          currentNumber={gameState.currentNumber}
          // Wire up callback handlers to gameState actions
          onCellSelect={handleCellSelect}
          onMoveRequest={handleMoveRequest}
          onDirectionToggleRequest={handleDirectionToggleRequest}
          onMoveToRequest={handleMoveToRequest}
          onBackspaceRequest={handleBackspaceRequest}
          onDeleteRequest={handleDeleteRequest}
          onCharacterEnteredRequest={handleCharacterEnteredRequest}
        >
          <CrosswordGrid />
        </CrosswordProvider>
      )}
    </ThemeProvider>
  );
};

export default ThemedCrossword; 