import React, { useContext, useRef } from "react";
import PropTypes, { InferProps } from "prop-types";
import styled, { ThemeContext } from "styled-components";
// NOTE: Cell.tsx is no longer imported or used in this refactored version
import { getCellKey } from "../../../lib/utils";
import { CrosswordContext } from "./context";
import { InputRefCallback, UsedCellData } from "../../types"; // Added UsedCellData

const SvgWrapper = styled.div`
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0; /* important for flex‐shrink */
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const StyledSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

// Define PropTypes for the props accepted by this component
const CrosswordGridPropTypes = {
  onInputRefChange: PropTypes.func,
};

// Define the TypeScript interface for the props
interface ICrosswordGridProps
  extends InferProps<typeof CrosswordGridPropTypes> {
  onInputRefChange?: InputRefCallback;
}

export default function CrosswordGrid({
  onInputRefChange,
}: ICrosswordGridProps) {
  // Get values from CrosswordContext
  const {
    rows,
    cols,
    gridData,
    cellCompletionStatus, // Get completion status map
    handleInputKeyDown,
    handleInputChange,
    handleCellClick, // Get the handler for cell clicks
    handleInputClick,
    selectedPosition: { row: focusedRow, col: focusedCol },
    selectedDirection,
    selectedNumber,
  } = useContext(CrosswordContext);

  // Get theme from ThemeContext
  const finalTheme = useContext(ThemeContext);
  // Setup ref for the hidden input
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate percentage sizes for the hidden input overlay
  const cellWidthPct = 100 / cols;
  const cellHeightPct = 100 / rows;

  // SVG viewBox maps directly to grid dimensions (#columns × #rows)
  const viewBox = `0 0 ${cols} ${rows}`;

  // --- Helper function to determine cell background fill ---
  const getCellFill = (
    isFocused: boolean,
    isHighlighted: boolean,
    status?: { completed: boolean; stage: number }
  ): string => {
    if (status?.completed) {
      // Use stage-based completion colors
      switch (status.stage) {
        case 1: return finalTheme?.completionStage1Background ?? '#2196F3';
        case 2: return finalTheme?.completionStage2Background ?? '#4CAF50';
        case 3: return finalTheme?.completionStage3Background ?? '#FFC107';
        case 4: return finalTheme?.completionStage4Background ?? '#FF9800';
        case 5: return finalTheme?.completionStage5Background ?? '#F44336';
        default: return finalTheme?.completionStage1Background ?? '#2196F3';
      }
    }
    if (isFocused) {
      return finalTheme?.focusBackground ?? "#e3f2fd";
    }
    if (isHighlighted) {
      return finalTheme?.highlightBackground ?? "#f5f9ff";
    }
    return finalTheme?.cellBackground ?? "#fffaf0";
  };

  // --- Helper function to determine cell text color ---
  const getTextColor = (
    status?: { completed: boolean; stage: number }
  ): string => {
    if (status?.completed) {
       // Use white text for completed stages for better contrast
      return '#FFFFFF';
    }
    // Use default text color otherwise
    return finalTheme?.textColor ?? "#2c3e50";
  };


  return (
    <SvgWrapper>
      <StyledSvg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" data-crossword-grid="true">
        {/* full‐grid background */}
        <rect
          x={0}
          y={0}
          width={cols}
          height={rows}
          fill={finalTheme?.gridBackground ?? "transparent"}
        />

        {/* Render each cell as a 1×1 square at (col,row) */}
        {gridData.flatMap((rowData, row) =>
          rowData.map((cellData, col) => {
            // Skip unused cells
            if (!cellData.used) return null;

            // Determine focus and highlight states
            const isFocused = row === focusedRow && col === focusedCol;
            const isHighlighted =
              !!selectedNumber &&
              cellData[selectedDirection] === selectedNumber;

            // Get completion status for the cell
            const key = getCellKey(row, col);
            const completionStatus = cellCompletionStatus?.get(key);

            // Determine fill and text colors based on state
            const cellFill = getCellFill(isFocused, isHighlighted, completionStatus);
            const textColor = getTextColor(completionStatus);

            // --- FIX 1: Added onClick handler to the <g> element ---
            return (
              <g
                key={key}
                transform={`translate(${col}, ${row})`}
                onClick={() => handleCellClick(cellData as UsedCellData)} // Pass cellData to handler
                style={{ cursor: 'default' }} // Keep cursor style
              >
                <rect
                  x={0}
                  y={0}
                  width={1}
                  height={1}
                  style={{
                    fill: cellFill, // Apply fill color via style prop
                  }}
                  stroke={finalTheme?.cellBorder ?? "#dde1e4"}
                  strokeWidth={0.02}
                  className={
                    isFocused ? "focused" : isHighlighted ? "highlighted" : ""
                  }
                />


                {cellData.number && (
                  <text
                    x={0.05} // Keep horizontal position near left
                    y={0.05} // Keep vertical anchor point near top
                    fontSize={0.3}
                    textAnchor="start"
                    dominantBaseline="auto" // Change baseline to 'auto' (or 'middle')
                    dy="0.9em" // Add dy for vertical adjustment (START EXPERIMENTING HERE)
                    // Ensure number color is not affected by completion status
                    fill={finalTheme?.numberColor ?? "#7f8c8d"}
                  >
                    {cellData.number}
                  </text>
                )}

                {/* letter guess */}
                <text
                  x={0.5}
                  y={0.5}
                  fontSize={0.7}
                  textAnchor="middle"
                  dy="0.34em"
                  className="guess-text" // Keep class for potential styling
                  style={{
                    fill: textColor, // Apply fill color via style prop
                  }}
                >
                  {cellData.guess || ""}
                </text>
              </g>
            );
          })
        )}
      </StyledSvg>

      {/* Hidden input remains the same, positioned over the "active" cell */}
      <input
        ref={(node) => {
          // Assign to local ref AND call the callback prop
          inputRef.current = node;
          onInputRefChange?.(node);
        }}
        aria-label="crossword-input"
        type="text"
        onClick={handleInputClick}
        onKeyDown={handleInputKeyDown}
        onChange={handleInputChange}
        value="" // Input is controlled via keydown
        autoComplete="off"
        spellCheck="false"
        autoCorrect="off"
        readOnly={true} // Prevent mobile keyboard from showing
        inputMode="none" // Explicitly prevent virtual keyboard on mobile
        style={{
          position: "absolute",
          top: `calc(${focusedRow * cellHeightPct}% + 2px)`,
          left: `calc(${focusedCol * cellWidthPct}% + 2px)`,
          width: `calc(${cellWidthPct}% - 4px)`,
          height: `calc(${cellHeightPct}% - 4px)`,
          fontSize: `calc((100% / ${rows}) * 0.7)`,
          textAlign: "center",
          backgroundColor: "transparent",
          caretColor: "transparent",
          margin: 0,
          padding: 0,
          border: 0,
          outline: "none",
          cursor: "default",
        }}
      />
    </SvgWrapper>
  );
}

// Assign PropTypes and export Props type
CrosswordGrid.propTypes = CrosswordGridPropTypes;
export type CrosswordGridProps = ICrosswordGridProps;