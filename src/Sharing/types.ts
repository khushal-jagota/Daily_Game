import { CluesInput, GridData } from '../Crossword/types';
import { crosswordTheme } from '../Crossword/styles/CrosswordStyles';

/**
 * Interface for data required to render the result canvas
 */
export interface CanvasData {
  puzzleData: CluesInput;
  gridData: GridData;
  completedWords: Map<string, { stage: number }>;
  elapsedTime: number;
  currentStage: number;
  theme: typeof crosswordTheme;
  
  // Optional puzzle metadata that might not be available in puzzleData
  puzzleNumber?: string | number;
  puzzleThemeName?: string;
} 