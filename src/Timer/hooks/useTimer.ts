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
   * 1: 0-30s (Blue)
   * 2: 31-70s (Green)
   * 3: 71-120s (Yellow)
   * 4: 121-180s (Orange)
   * 5: >180s (Red)
   */
  currentStage: number;
}

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
  
  // Track elapsed time in seconds
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
      
      // Update elapsed time every second
      intervalId = window.setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - (startTimeRef.current || currentTime)) / 1000);
        setElapsedTime(elapsedSeconds);
      }, 1000);
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
   * @returns Stage number (1-5)
   */
  const calculateStage = (time: number): number => {
    if (time <= 0) return 0; // Not started
    if (time <= 30) return 1; // Stage 1: 0-30s (Blue)
    if (time <= 70) return 2; // Stage 2: 31-70s (Green)
    if (time <= 120) return 3; // Stage 3: 71-120s (Yellow)
    if (time <= 180) return 4; // Stage 4: 121-180s (Orange)
    return 5; // Stage 5: >180s (Red)
  };
  
  return {
    elapsedTime,
    currentStage: calculateStage(elapsedTime)
  };
};

export default useTimer; 