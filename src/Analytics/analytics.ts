/**
 * Google Analytics event tracking utility for the game
 */

interface LevelEvent {
  theme_id: string | number;
}

interface LevelEndEvent extends LevelEvent {
  time_taken_seconds: number;
}

/**
 * Track when a user begins a puzzle
 * @param puzzleNumber The number of the puzzle being started
 */
export const trackLevelStart = (puzzleNumber: string | number): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;
    gtag('event', 'level_start', {
      theme_id: puzzleNumber
    });
  }
};

/**
 * Track when a user completes a puzzle
 * @param puzzleNumber The number of the puzzle being completed
 * @param timeInSeconds The time taken to complete the puzzle in seconds
 */
export const trackLevelEnd = (puzzleNumber: string | number, timeInSeconds: number): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;
    gtag('event', 'level_end', {
      theme_id: puzzleNumber,
      time_taken_seconds: timeInSeconds
    });
  }
};

/**
 * Track when a user clicks the share button
 * @param puzzleNumber The number of the current puzzle
 */
export const trackShareButtonClick = (puzzleNumber: string | number): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;
    gtag('event', 'share_button_click', {
      theme_id: puzzleNumber
    });
  }
}; 