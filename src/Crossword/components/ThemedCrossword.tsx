import React, { useMemo } from 'react';
import CrosswordProvider from './CrosswordCore/CrosswordProvider';
import CrosswordGrid from './CrosswordCore/CrosswordGrid';
import { Direction, GridData, InputRefCallback } from '../types';
import { getCellKey } from '../../lib/utils';

// Define the CompletionData interface
interface CompletionData {
  stage: number;
}

// Define the Props interface with expected gameState shape and onInputRefChange
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
    recentlyCompletedWordIds: Set<string>; // Add recently completed words for animation
    pendingCompletedWordIds: Set<string>; // Add pending words for two-phase commit
    // Action handlers
    handleCellSelect: (row: number, col: number) => void;
    handleMoveRequest: (dRow: number, dCol: number) => void;
    handleDirectionToggle: () => void;
    handleMoveToClueStart: (direction: Direction, number: string) => void;
    handleBackspace: () => void;
    handleDelete: () => void;
    handleGuessInput: (row: number, col: number, char: string) => void;
  };
  onInputRefChange?: InputRefCallback;
}

/**
 * Adapter component that connects useGameStateManager state with CrosswordProvider
 * Handles theme application, focus management, and action delegation
 */
const ThemedCrossword: React.FC<ThemedCrosswordProps> = ({ gameState, onInputRefChange }) => {
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

  return (
    gameState.puzzleData && (
      <CrosswordProvider
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
        // Pass animation-related state
        recentlyCompletedWordIds={gameState.recentlyCompletedWordIds}
        pendingCompletedWordIds={gameState.pendingCompletedWordIds}
        // Wire up callback handlers to gameState actions
        onCellSelect={gameState.handleCellSelect}
        onMoveRequest={gameState.handleMoveRequest}
        onDirectionToggleRequest={gameState.handleDirectionToggle}
        onMoveToRequest={gameState.handleCellSelect}
        onBackspaceRequest={gameState.handleBackspace}
        onDeleteRequest={gameState.handleDelete}
        // Replace onCharacterEnteredRequest with onGuessAttempt 
        onGuessAttempt={gameState.handleGuessInput}
      >
        <CrosswordGrid onInputRefChange={onInputRefChange} />
      </CrosswordProvider>
    )
  );
};

export default ThemedCrossword; 