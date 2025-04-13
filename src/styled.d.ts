import 'styled-components';
import { CrosswordTheme } from './Crossword/types/theme';

declare module 'styled-components' {
  export interface DefaultTheme extends CrosswordTheme {
    // DefaultTheme now includes all properties from CrosswordTheme
  }
} 