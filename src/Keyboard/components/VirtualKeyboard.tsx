import React from 'react';
import Keyboard from 'react-simple-keyboard'; // Remove LayoutObject import
import { KeyboardGlobalStyles } from '../styles/KeyboardStyles';

// Define LayoutObject type locally
type LayoutObject = {
  default: string[];
  [key: string]: string[];
};

// Removing the KeyboardContainer styled component as it's unnecessary

interface VirtualKeyboardProps {
  onKeyPress?: (button: string) => void; // Add onKeyPress prop type for later steps
}

// Define the custom layout object based on the image
const customLayout: LayoutObject = {
  default: [
    'q w e r t y u i o p',
    'a s d f g h j k l',
    '{enter} z x c v b n m {bksp}', // Use internal names {enter} and {bksp}
  ],
  // No 'shift' layout needed if we handle casing externally
};

// Define display mapping for special keys
const customDisplay = {
  '{enter}': 'ENTER', // Display text for the enter key
  '{bksp}': '⌫',     // Display text/symbol for backspace (use icon later if desired)
};

/**
 * Virtual Keyboard component that renders react-simple-keyboard
 * with a custom layout matching the design.
 */
const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress }) => {
  return (
    <>
      <KeyboardGlobalStyles />
      <Keyboard
        // --- Layout Configuration ---
        layout={customLayout}   // Apply the custom layout
        display={customDisplay}  // Apply the custom display text for special keys

        // --- Event Handling (Connects in later step) ---
        onKeyPress={onKeyPress} // Pass the handler down

        // --- Styling Configuration ---
        theme={"hg-theme-default"} // Use our custom theme 
        physicalKeyboardHighlight={true} // Highlight physical key presses on virtual layout
        mergeDisplay={true} // Merges layout and display intelligently
      />
    </>
  );
};

export default VirtualKeyboard;