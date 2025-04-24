// src/Sharing/utils/canvasRenderer.ts

import { CanvasData } from '../types';
import { CellData } from '../../Crossword/types';
import { crosswordTheme } from '../../Crossword/styles/CrosswordStyles';

// --- Helper Functions ---

/**
 * Formats seconds into MM:SS format
 */
function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Finds the maximum stage of any completed word that intersects with the given cell
 */
function findMaxStageForCell(
  cellData: CellData,
  completedWords: Map<string, { stage: number }>
): number {
  if (!cellData.used) return 0;
  let maxStage = 0;
  if (cellData.across) {
    const acrossWord = `${cellData.across}-across`;
    const completionAcross = completedWords.get(acrossWord);
    if (completionAcross) maxStage = Math.max(maxStage, completionAcross.stage);
  }
  if (cellData.down) {
    const downWord = `${cellData.down}-down`;
    const completionDown = completedWords.get(downWord);
    if (completionDown) maxStage = Math.max(maxStage, completionDown.stage);
  }
  return maxStage;
}

/**
 * Gets the appropriate fill color for a cell based on its stage
 */
function getCellFillColor(stage: number, theme: typeof crosswordTheme): string {
  switch (stage) {
    case 1: return theme.completionStage1Background;
    case 2: return theme.completionStage2Background;
    case 3: return theme.completionStage3Background;
    case 4: return theme.completionStage4Background;
    case 5: return theme.completionStage5Background;
    default: return theme.cellBackground;
  }
}

/**
 * Draws a rectangle with rounded corners.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (radius < 0) radius = 0;
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

// --- Main Drawing Function ---
export async function drawResultToCanvas(
  canvas: HTMLCanvasElement,
  data: CanvasData
): Promise<Blob | null> {
  console.log('%c[canvasRenderer] drawResultToCanvas called (v10 - removed grid area border)', 'color: green; font-weight: bold;');

  try {
    // --- Define Styling Constants ---
    const ACCENT_BORDER_WIDTH = 8; // Width of the colored accent frame (outermost visible layer)
    const GREY_MATTING_WIDTH = 42; // Width of the grey matting area
    const TOTAL_FRAME_WIDTH = ACCENT_BORDER_WIDTH + GREY_MATTING_WIDTH; // Combined width for positioning content
    const OUTER_BORDER_RADIUS = 15; // Rounding for the entire image/frame

    const CONTENT_PADDING = 25; // Padding inside the grey matting (affects time/grid position relative to black bg)
    const CELL_GAP = 6;
    const CELL_CORNER_RADIUS = 4;
    // const GRID_AREA_BORDER_WIDTH = 2; // Removed

    const FONT_SIZE_TIME = 34;
    const FONT_SIZE_COMBINED_INFO = 28; // Font size for "Puzzle #N - Theme"
    const FONT_FAMILY = 'Arial, sans-serif';
    const TEXT_COLOR = data.theme.textColor || '#EAEAEA';

    const TIME_MARGIN_TOP = CONTENT_PADDING; // Align time with top padding *inside black area*
    const GRID_MARGIN_TOP = 15; // Space between time and grid area start
    const TEXT_BOTTOM_MARGIN = 40; // Space between bottom of text and top of bottom *grey matting*

    // Calculate total reserved vertical space at the bottom for combined frame, margin, and text
    const RESERVED_BOTTOM_SPACE = TOTAL_FRAME_WIDTH + TEXT_BOTTOM_MARGIN + FONT_SIZE_COMBINED_INFO;

    // --- Set Canvas Dimensions ---
    const dpr = window.devicePixelRatio || 1;
    const baseWidth = 600;
    // Maintain previous canvas size calculation method for consistency
    const previousBottomTextAreaHeight = 40 + 28 + 25; // TEXT_BOTTOM_MARGIN + FONT_SIZE_COMBINED_INFO + CONTENT_PADDING (relative to grey border)
    const baseHeight = 700 + (previousBottomTextAreaHeight - CONTENT_PADDING); // Use old calculation reference point

    const targetWidth = baseWidth * dpr;
    const targetHeight = baseHeight * dpr;

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    canvas.style.width = `${baseWidth}px`;
    canvas.style.height = `${baseHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context');
        return null;
    }
    ctx.scale(dpr, dpr);

    const canvasWidth = baseWidth;
    const canvasHeight = baseHeight;

    // --- Pre-calculate Time Color (Needed for accent frame) ---
    let timeColor;
    switch (data.currentStage) {
      case 1: timeColor = data.theme.completionStage1Background; break;
      case 2: timeColor = data.theme.completionStage2Background; break;
      case 3: timeColor = data.theme.completionStage3Background; break;
      case 4: timeColor = data.theme.completionStage4Background; break;
      case 5: timeColor = data.theme.completionStage5Background; break;
      default: timeColor = TEXT_COLOR; // Fallback color
    }

    // --- Apply Clipping Mask for Rounded Outer Corners ---
    ctx.save();
    drawRoundedRect(ctx, 0, 0, canvasWidth, canvasHeight, OUTER_BORDER_RADIUS);
    ctx.clip();

    // --- Draw Background Layers (Accent, Matting, Content Background) ---
    // 1. Fill entire clipped area with the Accent Color (outermost visible layer)
    ctx.fillStyle = timeColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw Grey Matting inset by Accent Border Width
    ctx.fillStyle = '#2D2D2D';
    ctx.fillRect(
      ACCENT_BORDER_WIDTH,
      ACCENT_BORDER_WIDTH,
      canvasWidth - 2 * ACCENT_BORDER_WIDTH,
      canvasHeight - 2 * ACCENT_BORDER_WIDTH
    );

    // 3. Draw Inner Black Background inset by Total Frame Width
    ctx.fillStyle = '#121212';
    ctx.fillRect(
      TOTAL_FRAME_WIDTH, // Inset by Accent + Grey
      TOTAL_FRAME_WIDTH,
      canvasWidth - 2 * TOTAL_FRAME_WIDTH,
      canvasHeight - 2 * TOTAL_FRAME_WIDTH
    );

    // --- Time Rendering (Positioned relative to inner black background) ---
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.font = `bold ${FONT_SIZE_TIME}px ${FONT_FAMILY}`;
    const formattedTime = formatTime(data.elapsedTime);
    ctx.fillStyle = timeColor; // Use the pre-calculated color
    // Position relative to the start of the black background area + padding
    const timeX = canvasWidth - TOTAL_FRAME_WIDTH - CONTENT_PADDING;
    const timeY = TOTAL_FRAME_WIDTH + CONTENT_PADDING;
    ctx.fillText(formattedTime, timeX, timeY);
    const timeTextHeight = FONT_SIZE_TIME;

    // --- Grid Layout Calculations (Relative to inner black background) ---
    const gridContentAreaStartY = timeY + timeTextHeight + GRID_MARGIN_TOP; // Top edge for grid cell content area
    const numRows = data.gridData.length;
    const numCols = numRows > 0 ? data.gridData[0].length : 0;
    if (numRows === 0 || numCols === 0) {
       console.error('Invalid grid dimensions (0 rows or cols).');
       return null;
    }

    // Calculate available drawing space *inside* the black background area
    const availableWidth = canvasWidth - 2 * (TOTAL_FRAME_WIDTH + CONTENT_PADDING);
    const availableHeight = canvasHeight - gridContentAreaStartY - RESERVED_BOTTOM_SPACE;

    if (availableWidth <= 0 || availableHeight <= 0) {
       console.error('Not enough available space calculated for the grid (v10)', { canvasHeight, gridContentAreaStartY, RESERVED_BOTTOM_SPACE, availableHeight });
       return null;
     }

    // Calculate cell dimensions
    const cellSizeWithGap = Math.floor(Math.min(availableWidth / numCols, availableHeight / numRows));
    if (cellSizeWithGap <= CELL_GAP) {
       console.error('Calculated cell size is too small for the gap', { cellSizeWithGap, CELL_GAP });
       return null;
    }
    const cellDrawSize = cellSizeWithGap - CELL_GAP; // Actual size of the colored square

    // Calculate overall grid dimensions (visual part)
    const gridTotalWidth = numCols * cellSizeWithGap - CELL_GAP;
    const gridTotalHeight = numRows * cellSizeWithGap - CELL_GAP;

    // Calculate top-left starting position for the grid content area (within black bg)
    const gridContentStartX = TOTAL_FRAME_WIDTH + CONTENT_PADDING + (availableWidth - gridTotalWidth) / 2;
    const gridContentOffsetY = gridContentAreaStartY;

    // --- Draw Grid Area Border --- (REMOVED)
    /*
    ctx.lineWidth = GRID_AREA_BORDER_WIDTH;
    ctx.strokeStyle = timeColor; // Use the pre-calculated accent color
    const gridAreaBorderX = gridContentStartX + CELL_GAP / 2 - GRID_AREA_BORDER_WIDTH / 2;
    const gridAreaBorderY = gridContentOffsetY + CELL_GAP / 2 - GRID_AREA_BORDER_WIDTH / 2;
    const gridAreaBorderWidth = gridTotalWidth + GRID_AREA_BORDER_WIDTH;
    const gridAreaBorderHeight = gridTotalHeight + GRID_AREA_BORDER_WIDTH;
    drawRoundedRect(ctx, gridAreaBorderX, gridAreaBorderY, gridAreaBorderWidth, gridAreaBorderHeight, CELL_CORNER_RADIUS + GRID_AREA_BORDER_WIDTH / 2);
    ctx.stroke();
    */

    // --- Render Cells (Fill Only) ---
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const cellData = data.gridData[row][col];
        // Calculate position for this specific cell's drawing area (relative to gridContentStartX/Y)
        const cellAreaX = gridContentStartX + col * cellSizeWithGap;
        const cellAreaY = gridContentOffsetY + row * cellSizeWithGap;
        // Calculate top-left of the actual colored rectangle
        const cellDrawX = cellAreaX + CELL_GAP / 2;
        const cellDrawY = cellAreaY + CELL_GAP / 2;

        if (cellData.used) {
          const maxStage = findMaxStageForCell(cellData, data.completedWords);
          const fillColor = getCellFillColor(maxStage, data.theme);
          ctx.fillStyle = fillColor;
          drawRoundedRect(ctx, cellDrawX, cellDrawY, cellDrawSize, cellDrawSize, CELL_CORNER_RADIUS);
          ctx.fill();
        }
      }
    }

    // --- Combined Puzzle Info Text (Positioned near bottom) ---
    let combinedPuzzleInfoText = '';
    const hasNumber = data.puzzleNumber !== undefined && data.puzzleNumber !== null && data.puzzleNumber !== '';
    const hasTheme = data.puzzleThemeName && data.puzzleThemeName.trim() !== '';

    if (hasNumber && hasTheme) {
        combinedPuzzleInfoText = `Puzzle #${data.puzzleNumber} - ${data.puzzleThemeName}`;
    } else if (hasNumber) {
        combinedPuzzleInfoText = `Puzzle #${data.puzzleNumber}`;
    } else if (hasTheme) {
        combinedPuzzleInfoText = data.puzzleThemeName || '';
    }

    if (combinedPuzzleInfoText) {
        // Calculate Y position for the top of the text baseline, relative to bottom edge
        const textStartY = canvasHeight - TOTAL_FRAME_WIDTH - TEXT_BOTTOM_MARGIN - FONT_SIZE_COMBINED_INFO;
        const textCenterX = canvasWidth / 2; // Center horizontally

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = `${FONT_SIZE_COMBINED_INFO}px ${FONT_FAMILY}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(combinedPuzzleInfoText, textCenterX, textStartY);
    }

    // --- Restore context from clipping state ---
    ctx.restore(); // Restore context to state before clipping

    // --- Blob Conversion ---
    console.log('%c[canvasRenderer] Attempting canvas.toBlob conversion...', 'color: green;');
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('%c[canvasRenderer] canvas.toBlob successful.', 'color: green;');
          resolve(blob);
        } else {
          console.error(`%c[canvasRenderer] canvas.toBlob callback received null.`, 'color: red;');
          resolve(null);
        }
      }, 'image/png', 0.95);
    });
  } catch (error) {
    console.error('%c[canvasRenderer] Error during canvas rendering:', 'color: red;', error);
    return null;
  }
}