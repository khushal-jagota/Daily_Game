import 'styled-components';
import { crosswordTheme } from './Crossword/styles/CrosswordStyles'; // Import the theme type source

// Get the type of our theme object
type CrosswordThemeType = typeof crosswordTheme;

declare module 'styled-components' {
  // Extend the DefaultTheme interface from styled-components
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends CrosswordThemeType {}
} 