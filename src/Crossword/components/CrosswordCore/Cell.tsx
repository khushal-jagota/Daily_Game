import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from 'styled-components';

import { CrosswordSizeContext } from './context';
import type { UsedCellData, EnhancedProps } from '../../types';

const cellPropTypes = {
  /** the data specific to this cell */
  cellData: PropTypes.shape({
    row: PropTypes.number.isRequired,
    col: PropTypes.number.isRequired,
    guess: PropTypes.string, // .isRequired,
    number: PropTypes.string,
    answer: PropTypes.string,
  }).isRequired,

  /** whether this cell has focus */
  focus: PropTypes.bool,

  /** whether this cell is highlighted */
  highlight: PropTypes.bool,

  /** whether this cell is part of a completed word */
  completionStatus: PropTypes.shape({
    completed: PropTypes.bool.isRequired,
    stage: PropTypes.number,
  }),

  /** handler called when the cell is clicked */
  onClick: PropTypes.func,
};

export type CellProps = EnhancedProps<
  typeof cellPropTypes,
  {
    /** the data specific to this cell */
    cellData: UsedCellData;
    /** whether this cell is part of a completed word */
    completionStatus?: { completed: boolean; stage: number };
    /** handler called when the cell is clicked */
    onClick?: (cellData: UsedCellData) => void;
  }
>;

/**
 * An individual-letter answer cell within the crossword grid.
 *
 * A `Cell` lives inside the SVG for a
 * [`CrosswordGrid`](#/Complex%20layouts/CrosswordGrid), and renders at a
 * position determined by the `row`, `col`, and `cellSize` properties from
 * `cellData` and `renderContext`.
 */
export default function Cell({
  cellData,
  onClick,
  focus,
  highlight,
  completionStatus,
}: CellProps) {
  const { cellSize, cellPadding, cellInner, cellHalf, fontSize } =
    useContext(CrosswordSizeContext);
  const theme = useContext(ThemeContext) || {};

  // Set fallback values for theme properties
  const {
    cellBackground = '#fffaf0',
    cellBorder = '#dde1e4',
    textColor = '#2c3e50',
    numberColor = '#7f8c8d', 
    focusBackground = '#e3f2fd',
    highlightBackground = '#f5f9ff',
    completionStage1Background = '#2196F3',
    completionStage2Background = '#4CAF50',
    completionStage3Background = '#FFC107',
    completionStage4Background = '#FF9800',
    completionStage5Background = '#F44336',
    bookColor,
  } = theme;

  const handleClick = useCallback<React.MouseEventHandler>(
    (event) => {
      event.preventDefault();
      if (onClick) {
        onClick(cellData);
      }
    },
    [cellData, onClick]
  );

  const { row, col, guess, number, answer } = cellData;

  const x = col * cellSize;
  const y = row * cellSize;

  const borderColor = bookColor ? `${bookColor}80` : cellBorder;

  // Helper function to get background color based on stage
  const getBackgroundColor = () => {
    if (completionStatus?.completed) {
      const stage = completionStatus.stage;
      switch (stage) {
        case 1:
          return completionStage1Background;
        case 2:
          return completionStage2Background;
        case 3:
          return completionStage3Background;
        case 4:
          return completionStage4Background;
        case 5:
          return completionStage5Background;
        default:
          return completionStage1Background; // Default to stage 1 color
      }
    }
    if (focus) {
      return focusBackground;
    }
    if (highlight) {
      return highlightBackground;
    }
    return cellBackground;
  };

  // Helper function to get text color based on completion stage
  const getTextColor = () => {
    if (completionStatus?.completed) {
      // Use white text for all completion stages for better contrast
      return '#FFFFFF';
    }
    return textColor;
  };

  return (
    <g
      onClick={handleClick}
      style={{ cursor: 'default', fontSize: `${fontSize}px` }}
      className={`clue-cell ${answer === guess ? 'cell-correct' : ''}`}
      data-row={row}
      data-col={col}
    >
      <rect
        x={x + cellPadding}
        y={y + cellPadding}
        width={cellInner}
        height={cellInner}
        fill={getBackgroundColor()}
        stroke={borderColor}
        strokeWidth={cellSize / 50}
      />
      {number && (
        <text
          x={x + cellPadding * 4}
          y={y + cellPadding * 4}
          textAnchor="start"
          dominantBaseline="hanging"
          style={{ fontSize: '50%', fill: numberColor }}
        >
          {number}
        </text>
      )}
      <text
        x={x + cellHalf}
        y={y + cellHalf + 1} // +1 for visual alignment?
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fill: getTextColor() }}
        className={
          answer === guess ? 'guess-text-correct' : 'guess-text-incorrect'
        }
      >
        {guess}
      </text>
    </g>
  );
}

Cell.propTypes = cellPropTypes;

Cell.defaultProps = {
  focus: false,
  highlight: false,
  completionStatus: { completed: false, stage: 0 },
  onClick: null,
};

// export default Cell;
