import React, {
  useContext,
  useMemo,
  useRef,
} from 'react';
import PropTypes, { InferProps } from 'prop-types';

import styled, { ThemeContext } from 'styled-components';

import Cell from './Cell'; // Assuming Cell component is in the same directory
import { getCellKey } from '../../../lib/utils'; // Import getCellKey utility

import { CrosswordContext, CrosswordSizeContext } from './context';
import { InputRefCallback } from '../../types'; // Removed FocusHandler import

// GridWrapper styling remains unchanged
const GridWrapper = styled.div.attrs((/* props */) => ({
  className: 'crossword grid',
}))`
  /* position: relative; */
  /* min-width: 20rem; */
  /* max-width: 60rem; Should the size matter? */
  width: auto;
  flex: 2 1 50%;
`;

// Update PropTypes to include onInputRefChange
const CrosswordGridPropTypes = {
  // theme prop removed since it's now consumed from context
  onInputRefChange: PropTypes.func,
};

// Define an explicit interface that extends the inferred props
interface ICrosswordGridProps extends InferProps<typeof CrosswordGridPropTypes> {
  onInputRefChange?: InputRefCallback;
}

/**
 * The rendering component for the crossword grid itself.
 */
export default function CrosswordGrid({ onInputRefChange }: ICrosswordGridProps) {
  // Destructure necessary values from CrosswordContext
  // Renamed context props locally for clarity (focusedRow, focusedCol)
  const {
    rows,
    cols,
    gridData,
    cellCompletionStatus,
    handleInputKeyDown,
    handleInputChange,
    handleCellClick, // The context function itself
    handleInputClick,
    focused, // The internal focus state of the hidden input
    selectedPosition: { row: focusedRow, col: focusedCol }, // The selected cell coordinates
    selectedDirection: currentDirection, // The selected direction
    selectedNumber: currentNumber, // The selected clue number
  } = useContext(CrosswordContext);

  // Keep inputRef for the callback pattern
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the theme directly from context
  const finalTheme = useContext(ThemeContext);

  // Calculate sizing based on cell size (remains unchanged)
  const cellSize = 10;
  const cellPadding = 0.125;
  const cellInner = cellSize - cellPadding * 2;
  const cellHalf = cellSize / 2;
  const fontSize = cellInner * 0.7;

  const sizeContext = useMemo(
    () => ({
      cellSize,
      cellPadding,
      cellInner,
      cellHalf,
      fontSize,
    }),
    [cellSize, cellPadding, cellInner, cellHalf, fontSize] // Dependencies are constants, but keep for clarity
  );

  const height = useMemo(() => rows * cellSize, [rows]);
  const width = useMemo(() => cols * cellSize, [cols]);
  const cellWidthHtmlPct = useMemo(() => 100 / cols, [cols]);
  const cellHeightHtmlPct = useMemo(() => 100 / rows, [rows]);

  // Style for the hidden input (remains unchanged)
  const inputStyle = useMemo(
    () =>
      ({
        position: 'absolute',
        // Adjustments to align input (unchanged from original)
        top: `calc(${focusedRow * cellHeightHtmlPct * 0.995}% + 2px)`,
        left: `calc(${focusedCol * cellWidthHtmlPct}% + 2px)`,
        width: `calc(${cellWidthHtmlPct}% - 4px)`,
        height: `calc(${cellHeightHtmlPct}% - 4px)`,
        fontSize: `${fontSize * 6}px`, // Font size might need adjustment
        textAlign: 'center',
        textAnchor: 'middle',
        backgroundColor: 'transparent',
        caretColor: 'transparent', // Hide caret
        margin: 0,
        padding: 0,
        border: 0,
        outline: 'none',
        cursor: 'default',
      } as const), // Using 'as const' for stricter type checking on style object
    [cellWidthHtmlPct, cellHeightHtmlPct, focusedRow, focusedCol, fontSize]
  );

  return (
    <CrosswordSizeContext.Provider value={sizeContext}>
      <GridWrapper>
        {/* Outer div for positioning the input correctly */}
        <div style={{ margin: 0, padding: 0, position: 'relative' }}>
          <svg viewBox={`0 0 ${width} ${height}`}>
            {/* Background rectangle */}
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill={finalTheme?.gridBackground ?? 'transparent'}
            />
            {/* Render cells */}
            {gridData.flatMap((rowData, row) =>
              rowData.map((cellData, col) => {
                // Skip rendering if the cell is not used
                if (!cellData.used) {
                  return undefined;
                }

                // --- CORRECTED FOCUS/HIGHLIGHT CALCULATIONS ---
                // Determine if this cell is the currently focused cell based on context coordinates
                const isFocused = row === focusedRow && col === focusedCol;

                // Determine if this cell is part of the highlighted clue based on context direction/number
                const isHighlighted =
                  !!currentNumber && cellData[currentDirection] === currentNumber;
                
                // Get the cell completion status from the map
                const cellKey = getCellKey(row, col);
                const completionStatus = cellCompletionStatus?.get(cellKey);
                // --- END CORRECTIONS ---

                // --- TEMPORARY LOGGING (Uncomment to use) ---
                /*
                console.log(
                  `[Grid Rendering Cell ${row},${col}] ContextPos: (${focusedRow},${focusedCol}), ContextDir: ${currentDirection}, ContextNum: ${currentNumber} => Calculated: focus=${isFocused}, highlight=${isHighlighted}`
                );
                */
                // --- END LOGGING ---

                // Render the Cell component
                return (
                  <Cell
                    // Using standardized utility function for cell keys
                    key={getCellKey(row, col)}
                    cellData={cellData}
                    focus={isFocused}      // Pass calculated focus state
                    highlight={isHighlighted} // Pass calculated highlight state
                    completionStatus={completionStatus} // Pass completion status
                    // --- CORRECTED onClick ---
                    // Wrap context handler to pass correct cellData argument
                    onClick={() => handleCellClick(cellData)}
                  />
                );
              })
            )}
          </svg>
          {/* Hidden input field for capturing keyboard events */}
          <input
            ref={(node: HTMLInputElement | null) => {
              // Keep the inputRef for local use
              inputRef.current = node;
              // Call the callback passed from App.tsx if provided
              onInputRefChange?.(node);
            }}
            aria-label="crossword-input"
            type="text"
            onClick={handleInputClick}
            onKeyDown={handleInputKeyDown}
            onChange={handleInputChange}
            value=""
            autoComplete="off"
            spellCheck="false"
            autoCorrect="off"
            style={inputStyle}
          />
        </div>
      </GridWrapper>
    </CrosswordSizeContext.Provider>
  );
}

// Assign propTypes (remains unchanged)
CrosswordGrid.propTypes = CrosswordGridPropTypes;

// Export the type for other components
export type CrosswordGridProps = ICrosswordGridProps;