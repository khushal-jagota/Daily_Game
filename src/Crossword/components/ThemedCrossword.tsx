import React, { useCallback, useRef, useMemo } from 'react';
import CrosswordProvider from './CrosswordCore/CrosswordProvider';
import CrosswordGrid from './CrosswordCore/CrosswordGrid';
import { Direction, GridData } from '../types';
import { getCellKey } from '../../lib/utils';

// Import the proper imperative handle interface
import { CrosswordProviderImperative } from './CrosswordCore/CrosswordProvider';

// Define the CompletionData interface
interface CompletionData {
  stage: number;
}

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
    completedWords: Map<string, CompletionData>; // Changed from Set to Map with CompletionData
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

  // Calculate the cell completion status map based on completedWords and puzzleData
  const cellCompletionStatus = useMemo(() => {
    // Create a new map to store the completion status of each cell
    const statusMap = new Map<string, { completed: boolean; stage: number }>();
    
    // Process each completed word
    gameState.completedWords.forEach((completionData, wordId) => {
      try {
        // Parse the wordId to get direction and number
        const [number, direction] = wordId.split('-');
        if (!number || !direction) {
          console.warn(`[cellCompletionStatus] Invalid wordId format: ${wordId}`);
          return;
        }
        
        // Look up clue geometry in puzzleData
        const clueInfo = gameState.puzzleData[direction]?.[number];
        if (!clueInfo) {
          console.warn(`[cellCompletionStatus] Clue not found for ${direction} ${number}`);
          return;
        }
        
        // Calculate the cells occupied by this word
        const { row, col, answer } = clueInfo;
        if (!answer) {
          console.warn(`[cellCompletionStatus] Answer not found for ${direction} ${number}`);
          return;
        }
        
        // Mark each cell in the word as completed with the stage information
        for (let i = 0; i < answer.length; i++) {
          let r = row;
          let c = col;
          
          if (direction === 'across') {
            c += i;
          } else if (direction === 'down') {
            r += i;
          } else {
            console.warn(`[cellCompletionStatus] Invalid direction: ${direction}`);
            return;
          }
          
          // Generate cell key and mark as completed with stage information
          const cellKey = getCellKey(r, c);
          statusMap.set(cellKey, { completed: true, stage: completionData.stage });
        }
      } catch (error) {
        console.error(`[cellCompletionStatus] Error processing word ${wordId}:`, error);
      }
    });
    
    return statusMap;
  }, [gameState.completedWords, gameState.puzzleData]);

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
    gameState.puzzleData && (
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
        // Pass completion status map
        cellCompletionStatus={cellCompletionStatus}
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
    )
  );
};

export default ThemedCrossword; 