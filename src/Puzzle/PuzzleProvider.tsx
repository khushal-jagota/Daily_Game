import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../Integration/Firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CluesInput } from '../Crossword/types';

// Define the types for puzzle metadata
interface PuzzleMeta {
  activePuzzleId: string;
  puzzleNumber: number;
  genesisDate: string;
}

// Define basic structure for puzzle data
interface PuzzleData {
  puzzleData: CluesInput; // Explicitly typed as CluesInput
  themeTitle: string;
  themeDescription: string;
  // Other puzzle fields will be added here
}

// Define the type for our context state
interface PuzzleContextState {
  loadingState: 'idle' | 'loading' | 'success' | 'error';
  currentPuzzleMeta: PuzzleMeta | null;
  currentPuzzleData: PuzzleData | null;
  nextPuzzleData: any | null; // Will be typed properly later
  error: Error | null;
}

// Create the context with a default value
const PuzzleContext = createContext<PuzzleContextState | undefined>(undefined);

// Provider props type
interface PuzzleProviderProps {
  children: ReactNode;
}

export function PuzzleProvider({ children }: PuzzleProviderProps) {
  // Set up the state according to requirements
  const [state, setState] = useState<PuzzleContextState>({
    loadingState: 'idle',
    currentPuzzleMeta: null,
    currentPuzzleData: null,
    nextPuzzleData: null,
    error: null,
  });

  // Function to fetch puzzle data based on the activePuzzleId
  const fetchPuzzleData = async (activePuzzleId: string) => {
    try {
      // Construct the path to the puzzle document
      const puzzleDocRef = doc(db, 'puzzles', activePuzzleId);
      const puzzleDocSnap = await getDoc(puzzleDocRef);
      
      if (puzzleDocSnap.exists()) {
        const puzzleData = puzzleDocSnap.data();
        
        // Validate that the puzzle data contains the expected fields
        if (!puzzleData.puzzleData || !puzzleData.themeTitle || !puzzleData.themeDescription) {
          throw new Error('Puzzle data is missing required fields');
        }
        
        console.log('Puzzle data fetched:', puzzleData);
        
        setState(prev => ({
          ...prev,
          loadingState: 'success',
          currentPuzzleData: puzzleData as PuzzleData,
        }));
        
        return puzzleData;
      } else {
        throw new Error(`Puzzle data not found for ID: ${activePuzzleId}`);
      }
    } catch (error) {
      console.error('Error fetching puzzle data:', error);
      setState(prev => ({
        ...prev,
        loadingState: 'error',
        error: error instanceof Error ? error : new Error('Unknown error occurred while fetching puzzle data'),
      }));
      return null;
    }
  };

  // Function to fetch the puzzle pointer from Firestore, then fetch the puzzle
  const fetchPuzzlePointer = async () => {
    try {
      setState(prev => ({ ...prev, loadingState: 'loading' }));
      
      // Fetch the /meta/current document
      const metaDocRef = doc(db, 'meta', 'current');
      const metaDocSnap = await getDoc(metaDocRef);
      
      if (metaDocSnap.exists()) {
        const data = metaDocSnap.data() as PuzzleMeta;
        console.log('Puzzle pointer fetched:', data);
        
        // Store the meta data first
        setState(prev => ({
          ...prev,
          currentPuzzleMeta: {
            activePuzzleId: data.activePuzzleId,
            puzzleNumber: data.puzzleNumber,
            genesisDate: data.genesisDate,
          },
        }));
        
        // Now fetch the actual puzzle data using the activePuzzleId
        await fetchPuzzleData(data.activePuzzleId);
      } else {
        throw new Error('No current puzzle metadata found');
      }
    } catch (error) {
      console.error('Error fetching puzzle pointer:', error);
      setState(prev => ({
        ...prev,
        loadingState: 'error',
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      }));
    }
  };

  // Trigger the fetch on mount
  useEffect(() => {
    fetchPuzzlePointer();
  }, []);

  return (
    <PuzzleContext.Provider value={state}>
      {children}
    </PuzzleContext.Provider>
  );
}

// Custom hook for using the puzzle context
export function usePuzzleLoader() {
  const context = useContext(PuzzleContext);
  if (context === undefined) {
    throw new Error('usePuzzleLoader must be used within a PuzzleProvider');
  }
  return context;
} 