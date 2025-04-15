import React, { useCallback, useRef } from 'react';
import { ThemeProvider } from 'styled-components';
import CrosswordProvider from './CrosswordCore/CrosswordProvider';
import CrosswordGrid from './CrosswordCore/CrosswordGrid';
import { crosswordTheme } from '../styles/CrosswordStyles';
import { Direction, GridData } from '../types';
import { useGameStateManager } from '../../GameFlow/state/useGameStateManager';

// Import the proper imperative handle interface
import { CrosswordProviderImperative } from './CrosswordCore/CrosswordProvider';

// Define the Props interface with expected gameState shape
interface ThemedCrosswordProps {
  gameState: {
    // State
    puzzleData: any;
    gridData: GridData;
    selectedRow: number;
    selectedCol: number;
    currentDirection: Direction;
    currentNumber: string;
    completedWords: Set<string>; // For debugging in DevTools
    // Action handlers
    handleCellSelect: (row: number, col: number) => void;
    handleMoveRequest: (dRow: number, dCol: number) => void;
    handleDirectionToggle: () => void;
    handleMoveToClueStart: (direction: Direction, number: string) => void;
    handleBackspace: () => void;
    handleDelete: () => void;
    handleGuessInput: (row: number, col: number, char: string) => void;
  };
}

/**
 * Adapter component that connects useGameStateManager state with CrosswordProvider
 * Handles theme application, focus management, and action delegation
 */
const ThemedCrossword: React.FC<ThemedCrosswordProps> = ({ gameState }) => {
  // Create ref for CrosswordProvider to access imperative focus method
  const crosswordProviderRef = useRef<CrosswordProviderImperative>(null);

  // Focus helper function
  const focus = useCallback(() => {
    crosswordProviderRef.current?.focus();
  }, []);

  // Callback handlers that execute gameState actions and restore focus
  const handleCellSelect = useCallback((row: number, col: number) => {
    gameState.handleCellSelect(row, col);
    // Restore focus after state update
    focus();
  }, [gameState, focus]);

  const handleMoveRequest = useCallback((dRow: number, dCol: number) => {
    gameState.handleMoveRequest(dRow, dCol);
    focus();
  }, [gameState, focus]);

  const handleDirectionToggleRequest = useCallback(() => {
    gameState.handleDirectionToggle();
    focus();
  }, [gameState, focus]);

  const handleMoveToRequest = useCallback((row: number, col: number) => {
    // This is used when internally jumping to a cell (rather than a clue number)
    gameState.handleCellSelect(row, col);
    focus();
  }, [gameState, focus]);

  const handleBackspaceRequest = useCallback(() => {
    // No need to pass completedWordIds anymore - using internal state in the hook
    gameState.handleBackspace();
    focus();
  }, [gameState, focus]);

  const handleDeleteRequest = useCallback(() => {
    // No need to pass completedWordIds anymore - using internal state in the hook
    gameState.handleDelete();
    focus();
  }, [gameState, focus]);

  // New handler for guess attempts
  const handleGuessAttempt = useCallback((row: number, col: number, char: string) => {
    // No need to pass completedWordIds anymore - using internal state in the hook
    gameState.handleGuessInput(row, col, char);
    focus();
  }, [gameState, focus]);

  return (
    <ThemeProvider theme={crosswordTheme}>
      {gameState.puzzleData && (
        <CrosswordProvider
          ref={crosswordProviderRef}
          data={gameState.puzzleData}
          useStorage={false}
          // Pass gridData from gameState (central source of truth)
          gridData={gameState.gridData}
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
          // Replace onCharacterEnteredRequest with onGuessAttempt 
          onGuessAttempt={handleGuessAttempt}
        >
          <CrosswordGrid />
        </CrosswordProvider>
      )}
    </ThemeProvider>
  );
};

export default ThemedCrossword; 