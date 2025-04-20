//? Old implementation using  refs, I refactored into css only
// import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
// import PropTypes, { InferProps } from "prop-types";

// import styled, { ThemeContext } from "styled-components";

// import Cell from "./Cell"; // Assuming Cell component is in the same directory
// import { getCellKey } from "../../../lib/utils"; // Import getCellKey utility

// import { CrosswordContext, CrosswordSizeContext } from "./context";
// import { InputRefCallback } from "../../types"; // Removed FocusHandler import

// // GridWrapper styling remains unchanged
// // const GridWrapper = styled.div.attrs((/* props */) => ({
// //   className: "crossword grid",
// // }))`
// //   display: flex; /* turn into a flex-item */
// //   flex: 1 1 auto; /* grow and shrink to fill parent */
// //   min-height: 0; /* allow shrinking below content height */
// //   width: 100%;
// // `;

// export const SvgWrapper = styled.div`
//   position: relative;
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   flex: 1 1 auto;
//   min-height: 0;
//   overflow: hidden;
// `;

// // Update PropTypes to include onInputRefChange
// const CrosswordGridPropTypes = {
//   // theme prop removed since it's now consumed from context
//   onInputRefChange: PropTypes.func,
// };

// // Define an explicit interface that extends the inferred props
// interface ICrosswordGridProps
//   extends InferProps<typeof CrosswordGridPropTypes> {
//   onInputRefChange?: InputRefCallback;
// }

// /**
//  * The rendering component for the crossword grid itself.
//  */
// export default function CrosswordGrid({
//   onInputRefChange,
// }: ICrosswordGridProps) {
//   // Destructure necessary values from CrosswordContext
//   // Renamed context props locally for clarity (focusedRow, focusedCol)
//   const {
//     rows,
//     cols,
//     gridData,
//     cellCompletionStatus,
//     handleInputKeyDown,
//     handleInputChange,
//     handleCellClick, // The context function itself
//     handleInputClick,
//     focused, // The internal focus state of the hidden input
//     selectedPosition: { row: focusedRow, col: focusedCol }, // The selected cell coordinates
//     selectedDirection: currentDirection, // The selected direction
//     selectedNumber: currentNumber, // The selected clue number
//   } = useContext(CrosswordContext);

//   // Keep inputRef for the callback pattern
//   const inputRef = useRef<HTMLInputElement>(null);

//   const wrapperRef = useRef<HTMLDivElement>(null);
//   const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });

//   useEffect(() => {
//     if (!wrapperRef.current) return;
//     const ro = new ResizeObserver((entries) => {
//       for (let entry of entries) {
//         const { width, height } = entry.contentRect;
//         setWrapperSize({ width, height });
//       }
//     });
//     ro.observe(wrapperRef.current);
//     return () => ro.disconnect();
//   }, []);

//   const cellSize = useMemo(() => {
//     if (cols === 0 || rows === 0) return 0;
//     const size = Math.min(wrapperSize.width / cols, wrapperSize.height / rows);
//     console.log("size", size);
//     return size;
//   }, [wrapperSize, cols, rows]);

//   // Get the theme directly from context
//   const finalTheme = useContext(ThemeContext);

//   // Calculate sizing based on cell size (remains unchanged)
//   // const cellSize = 10;
//   // 3) ✨ Derive all the constants off of that
//   const cellPadding = cellSize * 0.0125; // same ratio as .125 / 10
//   const cellInner = cellSize - cellPadding * 2;
//   const cellHalf = cellSize / 2;
//   const fontSize = cellInner * 0.7;

//   const sizeContext = useMemo(
//     () => ({ cellSize, cellPadding, cellInner, cellHalf, fontSize }),
//     [cellSize, cellPadding, cellInner, cellHalf, fontSize]
//   );

//   // 4) ✨ SVG dimensions from dynamic cellSize
//   const svgWidth = cols * cellSize;
//   const svgHeight = rows * cellSize;

//   // Hidden input styling just scales with the same percentages
//   const cellWidthPct = 100 / cols;
//   const cellHeightPct = 100 / rows;
//   // useMemo(() => {
//   //   console.log("cellWidthPct", svgWidth);
//   // }, [svgWidth]);
//   useMemo(() => {
//     console.log("cellHeightPct", cellHeightPct);
//   }, [cellHeightPct]);
//   useMemo(() => {
//     console.log("svgHeight", svgHeight);
//   }, [svgHeight]);

//   const inputStyle = useMemo(
//     () =>
//       ({
//         position: "absolute",
//         top: `calc(${focusedRow * cellHeightPct}% + 2px)`,
//         left: `calc(${focusedCol * cellWidthPct}% + 2px)`,
//         width: `calc(${cellWidthPct}% - 4px)`,
//         height: `calc(${cellHeightPct}% - 4px)`,
//         fontSize: `${fontSize * 6}px`,
//         textAlign: "center",
//         backgroundColor: "transparent",
//         caretColor: "transparent",
//         margin: 0,
//         padding: 0,
//         border: 0,
//         outline: "none",
//         cursor: "default",
//       } as const),
//     [cellWidthPct, cellHeightPct, focusedRow, focusedCol, fontSize]
//   );

//   //? I commented out the old implementation
//   // const sizeContext = useMemo(
//   //   () => ({
//   //     cellSize,
//   //     cellPadding,
//   //     cellInner,
//   //     cellHalf,
//   //     fontSize,
//   //   }),
//   //   [cellSize, cellPadding, cellInner, cellHalf, fontSize] // Dependencies are constants, but keep for clarity
//   // );

//   // const height = useMemo(() => rows * cellSize, [rows, cellSize]);
//   // const width = useMemo(() => cols * cellSize, [cols, cellSize]);
//   // const cellWidthHtmlPct = useMemo(() => 100 / cols, [cols]);
//   // const cellHeightHtmlPct = useMemo(() => 100 / rows, [rows]);

//   // // Style for the hidden input (remains unchanged)
//   // const inputStyle = useMemo(
//   //   () =>
//   //     ({
//   //       position: "absolute",
//   //       // Adjustments to align input (unchanged from original)
//   //       top: `calc(${focusedRow * cellHeightHtmlPct * 0.995}% + 2px)`,
//   //       left: `calc(${focusedCol * cellWidthHtmlPct}% + 2px)`,
//   //       width: `calc(${cellWidthHtmlPct}% - 4px)`,
//   //       height: `calc(${cellHeightHtmlPct}% - 4px)`,
//   //       fontSize: `${fontSize * 6}px`, // Font size might need adjustment
//   //       textAlign: "center",
//   //       textAnchor: "middle",
//   //       backgroundColor: "transparent",
//   //       caretColor: "transparent", // Hide caret
//   //       margin: 0,
//   //       padding: 0,
//   //       border: 0,
//   //       outline: "none",
//   //       cursor: "default",
//   //     } as const), // Using 'as const' for stricter type checking on style object
//   //   [cellWidthHtmlPct, cellHeightHtmlPct, focusedRow, focusedCol, fontSize]
//   // );

//   return (
//     <CrosswordSizeContext.Provider value={sizeContext}>
//       {/* <GridWrapper> */}
//       {/* Outer div for positioning the input correctly */}
//       <div
//         style={{
//           position: "relative",
//           flex: 1 /* fill the GridWrapper’s height */,
//           minHeight: 0 /* again, allow it to shrink */,
//           overflow: "hidden" /* clip anything outside */,
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//           flexGrow: 1,
//           flexShrink: 1,
//           flexBasis: "auto",
//           height: "100%",
//         }}
//         id={"svg-size-wrapper"}
//         ref={wrapperRef}
//       >
//         <svg
//           viewBox={`0 0 ${svgWidth} ${svgHeight}`}
//           preserveAspectRatio="xMidYMid meet"
//           style={{
//             display: "block",
//             width: "100%",
//             height: "100%",
//           }}
//         >
//           {/* Background rectangle */}
//           <rect
//             x={0}
//             y={0}
//             width={svgWidth}
//             height={svgHeight}
//             fill={finalTheme?.gridBackground ?? "transparent"}
//           />
//           {/* Render cells */}
//           {gridData.flatMap((rowData, row) =>
//             rowData.map((cellData, col) => {
//               // Skip rendering if the cell is not used
//               if (!cellData.used) {
//                 return undefined;
//               }

//               // --- CORRECTED FOCUS/HIGHLIGHT CALCULATIONS ---
//               // Determine if this cell is the currently focused cell based on context coordinates
//               const isFocused = row === focusedRow && col === focusedCol;

//               // Determine if this cell is part of the highlighted clue based on context direction/number
//               const isHighlighted =
//                 !!currentNumber && cellData[currentDirection] === currentNumber;

//               // Get the cell completion status from the map
//               const cellKey = getCellKey(row, col);
//               const completionStatus = cellCompletionStatus?.get(cellKey);
//               // --- END CORRECTIONS ---

//               // --- TEMPORARY LOGGING (Uncomment to use) ---
//               /*
//                 console.log(
//                   `[Grid Rendering Cell ${row},${col}] ContextPos: (${focusedRow},${focusedCol}), ContextDir: ${currentDirection}, ContextNum: ${currentNumber} => Calculated: focus=${isFocused}, highlight=${isHighlighted}`
//                 );
//                 */
//               // --- END LOGGING ---

//               // Render the Cell component
//               return (
//                 <Cell
//                   // Using standardized utility function for cell keys
//                   key={getCellKey(row, col)}
//                   cellData={cellData}
//                   focus={isFocused} // Pass calculated focus state
//                   highlight={isHighlighted} // Pass calculated highlight state
//                   completionStatus={completionStatus} // Pass completion status
//                   // --- CORRECTED onClick ---
//                   // Wrap context handler to pass correct cellData argument
//                   onClick={() => handleCellClick(cellData)}
//                 />
//               );
//             })
//           )}
//         </svg>
//         {/* Hidden input field for capturing keyboard events */}
//         <input
//           ref={(node: HTMLInputElement | null) => {
//             // Keep the inputRef for local use
//             inputRef.current = node;
//             // Call the callback passed from App.tsx if provided
//             onInputRefChange?.(node);
//           }}
//           aria-label="crossword-input"
//           type="text"
//           onClick={handleInputClick}
//           onKeyDown={handleInputKeyDown}
//           onChange={handleInputChange}
//           value=""
//           autoComplete="off"
//           spellCheck="false"
//           autoCorrect="off"
//           style={inputStyle}
//         />
//       </div>
//       {/* </GridWrapper> */}
//     </CrosswordSizeContext.Provider>
//   );
// }

// // Assign propTypes (remains unchanged)
// CrosswordGrid.propTypes = CrosswordGridPropTypes;

// // Export the type for other components
// export type CrosswordGridProps = ICrosswordGridProps;

import React, { useContext, useRef } from "react";
import PropTypes, { InferProps } from "prop-types";
import styled, { ThemeContext } from "styled-components";
import Cell from "./Cell";
import { getCellKey } from "../../../lib/utils";
import { CrosswordContext } from "./context";
import { InputRefCallback } from "../../types";

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

const CrosswordGridPropTypes = {
  onInputRefChange: PropTypes.func,
};

interface ICrosswordGridProps
  extends InferProps<typeof CrosswordGridPropTypes> {
  onInputRefChange?: InputRefCallback;
}

export default function CrosswordGrid({
  onInputRefChange,
}: ICrosswordGridProps) {
  const {
    rows,
    cols,
    gridData,
    cellCompletionStatus,
    handleInputKeyDown,
    handleInputChange,
    handleCellClick,
    handleInputClick,
    selectedPosition: { row: focusedRow, col: focusedCol },
    selectedDirection,
    selectedNumber,
  } = useContext(CrosswordContext);

  const finalTheme = useContext(ThemeContext);
  const inputRef = useRef<HTMLInputElement>(null);

  // Percent sizes for the input overlay
  const cellWidthPct = 100 / cols;
  const cellHeightPct = 100 / rows;

  // SVG viewBox maps directly to #columns × #rows
  const viewBox = `0 0 ${cols} ${rows}`;

  return (
    <SvgWrapper>
      <StyledSvg viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
        {/* full‑grid background */}
        <rect
          x={0}
          y={0}
          width={cols}
          height={rows}
          fill={finalTheme?.gridBackground ?? "transparent"}
        />

        {/* each cell is a 1×1 square at (col,row) */}
        {gridData.flatMap((rowData, row) =>
          rowData.map((cellData, col) => {
            if (!cellData.used) return null;

            const isFocused = row === focusedRow && col === focusedCol;
            const isHighlighted =
              !!selectedNumber &&
              cellData[selectedDirection] === selectedNumber;

            const key = getCellKey(row, col);
            const completion = cellCompletionStatus?.get(key);

            return (
              <g key={key} transform={`translate(${col}, ${row})`}>
                <rect
                  x={0}
                  y={0}
                  width={1}
                  height={1}
                  fill={finalTheme?.cellBackground ?? "#fffaf0"}
                  stroke={finalTheme?.cellBorder ?? "#dde1e4"}
                  strokeWidth={0.02}
                  className={
                    isFocused
                      ? "focused"
                      : isHighlighted
                      ? "highlighted"
                      : undefined
                  }
                />

                {/* clue number */}
                {cellData.number && (
                  <text
                    x={0.05}
                    y={0.05}
                    fontSize={0.3}
                    textAnchor="start"
                    dominantBaseline="hanging"
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
                  dominantBaseline="middle"
                  className="guess-text"
                  fill={finalTheme?.textColor ?? "#2c3e50"}
                >
                  {completion || ""}
                </text>
              </g>
            );
          })
        )}
      </StyledSvg>

      {/* hidden input over the “active” cell, purely percent‑based */}
      <input
        ref={(node) => {
          inputRef.current = node;
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

CrosswordGrid.propTypes = CrosswordGridPropTypes;
export type CrosswordGridProps = ICrosswordGridProps;
