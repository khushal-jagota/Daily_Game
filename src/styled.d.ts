import 'styled-components';
import { CrosswordTheme } from './Crossword/types';

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends CrosswordTheme {
    // DefaultTheme now includes all properties from CrosswordTheme
  }
} 