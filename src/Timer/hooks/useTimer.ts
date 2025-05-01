import { useState, useEffect, useRef } from 'react';

/**
 * Interface for the useTimer hook parameters
 */
interface UseTimerProps {
  /**
   * Boolean indicating if the game is currently active
   */
  isGameActive: boolean;
  
  /**
   * Boolean indicating if the game has been completed
   * When true, the timer should stop but preserve the final time
   */
  isGameComplete?: boolean;
}

/**
 * Interface for the useTimer hook return values
 */
interface UseTimerReturn {
  /**
   * Elapsed time in seconds
   */
  elapsedTime: number;
  
  /**
   * Current completion stage based on elapsed time
   * 0: Game not started
   * 1: 0-30s (Green)
   * 2: 31-75s (Lime)
   * 3: 76-135s (Yellow-Orange)
   * 4: 136-210s (Orange)
   * 5: 211-300s (Red-Orange)
   * 6: >300s (Brown)
   */
  currentStage: number;
  
  /**
   * Ratio of time remaining in current stage (1.0 to 0.0)
   * 1.0 = full bar (just entered stage or special case)
   * 0.0 = empty bar (about to transition to next stage)
   */
  stageTimeRemainingRatio: number;
}

/**
 * Stage time thresholds in seconds
 * Index corresponds to stage transition points:
 * 0: Start
 * 1: Stage 1 to 2 transition (30s)
 * 2: Stage 2 to 3 transition (75s)
 * 3: Stage 3 to 4 transition (135s)
 * 4: Stage 4 to 5 transition (210s)
 * 5: Stage 5 to 6 transition (300s)
 */
export const STAGE_THRESHOLDS = [0, 30, 75, 135, 210, 300];

/**
 * Custom hook that tracks game time and calculates completion stage.
 * 
 * @param {UseTimerProps} props - Hook parameters
 * @returns {UseTimerReturn} - Elapsed time and current stage
 */
export const useTimer = ({ 
  isGameActive, 
  isGameComplete = false 
}: UseTimerProps): UseTimerReturn => {
  // Track when game started
  const startTimeRef = useRef<number | null>(null);
  
  // Track elapsed time in seconds (as a precise floating-point number)
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  // Track if the game was previously completed (to preserve final time)
  const wasCompletedRef = useRef<boolean>(false);
  
  // Set up the timer when game becomes active
  useEffect(() => {
    let intervalId: number | undefined;
    
    // If the game is completed, preserve the final time
    if (isGameComplete) {
      wasCompletedRef.current = true;
      
      // Stop the interval if running
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      return;
    }
    
    if (isGameActive) {
      // Record start time when game first becomes active
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
      
      // Update elapsed time every 50ms with precise calculation
      intervalId = window.setInterval(() => {
        const currentTime = Date.now();
        // Calculate precise seconds (no Math.floor)
        const elapsedSecondsPrecise = (currentTime - (startTimeRef.current || currentTime)) / 1000;
        setElapsedTime(elapsedSecondsPrecise);
      }, 50);
    } else if (!wasCompletedRef.current) {
      // Only reset if the game is not active AND not completed
      // This preserves the final time when a game is completed
      startTimeRef.current = null;
      setElapsedTime(0);
    }
    
    // Clean up interval on unmount or when isGameActive changes
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isGameActive, isGameComplete]);
  
  /**
   * Calculate the stage based on elapsed time
   * @param time - Time in seconds
   * @returns Stage number (1-6)
   */
  const calculateStage = (time: number): number => {
    if (time <= STAGE_THRESHOLDS[0]) return 0; // Not started
    if (time <= STAGE_THRESHOLDS[1]) return 1; // Stage 1: 0-30s
    if (time <= STAGE_THRESHOLDS[2]) return 2; // Stage 2: 31-75s
    if (time <= STAGE_THRESHOLDS[3]) return 3; // Stage 3: 76-135s
    if (time <= STAGE_THRESHOLDS[4]) return 4; // Stage 4: 136-210s
    if (time <= STAGE_THRESHOLDS[5]) return 5; // Stage 5: 211-300s
    return 6; // Stage 6: >300s
  };
  
  /**
   * Calculate the ratio of time remaining in the current stage (1.0 to 0.0)
   * @param time - Current elapsed time in seconds
   * @param stage - Current stage (0-6)
   * @returns Ratio of time remaining in the current stage
   */
  const calculateStageTimeRemainingRatio = (time: number, stage: number): number => {
    // Handle Stage 0 (not started): return full bar
    if (stage === 0) return 1.0;
    
    // Handle Stage 6 (overtime): return full bar
    if (stage === 6) return 1.0;
    
    // For Stages 1-5, calculate the ratio based on time elapsed in the stage
    const stageStartTime = STAGE_THRESHOLDS[stage - 1];
    const stageEndTime = STAGE_THRESHOLDS[stage];
    const stageDuration = stageEndTime - stageStartTime;
    const timeElapsedInStage = time - stageStartTime;
    
    // Calculate ratio: 1.0 (just started stage) to 0.0 (about to transition)
    const ratio = 1 - (timeElapsedInStage / stageDuration);
    
    // Clamp between 0 and 1 to handle any edge cases
    return Math.max(0, Math.min(1, ratio));
  };
  
  // Calculate current stage (using the precise elapsed time)
  const currentStage = calculateStage(elapsedTime);
  
  // Calculate time remaining ratio (using the precise elapsed time)
  const stageTimeRemainingRatio = calculateStageTimeRemainingRatio(elapsedTime, currentStage);
  
  return {
    elapsedTime: Math.floor(elapsedTime), // Floor only for external display
    currentStage,
    stageTimeRemainingRatio
  };
};

export default useTimer; 