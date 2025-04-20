import { createGlobalStyle } from 'styled-components';

// Global styles for keyboard component that use theme variables
export const KeyboardGlobalStyles = createGlobalStyle`
  /* Apply theme-based styling to the keyboard container */
  .hg-theme-default {
    background: ${props => props.theme.keyboardBackground || '#fffaf0'};
    border-radius: 8px;
    box-sizing: border-box;
    font-family: sans-serif;
    overflow: hidden;
    padding: 3px;
    touch-action: manipulation;
    user-select: none;
    width: 100%;
  }

  /* Style for all keyboard buttons with theme variables */
  .hg-theme-default .hg-button {
    background: ${props => props.theme.keyBackground || '#ffffff'};
    border: none;
    border-radius: 5px;
    box-sizing: border-box;
    color: ${props => props.theme.keyColor || '#2c3e50'};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(0.9rem, 2.5vmin, 1.1rem);
    height: 58px;
    margin: 0;
    flex: 1;
    position: relative;
    transition: background 0.2s ease;
    text-transform: uppercase;
    font-weight: bold;
  }

  /* Hover state for keyboard buttons */
  .hg-theme-default .hg-button:hover {
    background: ${props => props.theme.focusBackground || '#e3f2fd'};
  }

  /* Active state for keyboard buttons */
  .hg-theme-default .hg-button:active {
    background: ${props => props.theme.highlightBackground || '#f5f9ff'};
  }

  /* Style for special keys (enter and backspace) */
  .hg-theme-default .hg-button.hg-button-enter,
  .hg-theme-default .hg-button.hg-button-bksp {
    background: ${props => props.theme.specialKeyBackground || '#e3f2fd'};
    color: ${props => props.theme.keyColor || '#2c3e50'};
    font-weight: bold;
    flex-grow: 1.5;
  }
  
  /* Specific styling for backspace key */
  .hg-theme-default .hg-button.hg-button-bksp {
    padding-bottom: 0;
  }
  
  /* Backspace icon styling for SVG (if used later) */
  .hg-theme-default .hg-button.hg-button-bksp svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
  
  /* Row styling for better alignment */
  .hg-theme-default .hg-row {
    display: flex;
    width: 100%;
    gap: 5px;
    margin: 0 auto 4px;
    padding: 0 8px;
  }
  
  /* Second row styling */
  .hg-theme-default .hg-row:nth-of-type(2) {
    padding: 0 25px;
  }
  
  /* Last row styling */
  .hg-theme-default .hg-row:last-of-type {
    margin-bottom: 0;
  }
  
  /* Keyboard layout spacing */
  .hg-theme-default.hg-layout-default {
    padding: 0;
  }

  /* Media queries removed as requested */
`; 