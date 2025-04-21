// src/Sharing/utils/canvasRenderer.ts

import { CanvasData } from '../types';
import { CellData } from '../../Crossword/types'; // Assuming UsedCellData is implicitly handled by CellData or needs import if separate
import { crosswordTheme } from '../../Crossword/styles/CrosswordStyles';

/**
 * Formats seconds into MM:SS format
 */
function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0; // Handle negative values just in case
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Finds the maximum stage of any completed word that intersects with the given cell
 * @param cellData Cell data containing across/down references
 * @param completedWords Map of completed words with their stages
 * @returns The highest stage number (1-5) or 0 if no completed words
 */
function findMaxStageForCell(
  cellData: CellData,
  completedWords: Map<string, { stage: number }>
): number {
  // If cell is not used return 0
  if (!cellData.used) return 0;

  let maxStage = 0;

  // Check across clue if it exists
  if (cellData.across) {
    // --- FIXED KEY FORMAT ---
    const acrossWord = `${cellData.across}-across`;
    // --- END FIX ---
    const completionAcross = completedWords.get(acrossWord); // Use get directly
    if (completionAcross) {
      maxStage = Math.max(maxStage, completionAcross.stage);
    }
  }

  // Check down clue if it exists
  if (cellData.down) {
    // --- FIXED KEY FORMAT ---
    const downWord = `${cellData.down}-down`;
    // --- END FIX ---
    const completionDown = completedWords.get(downWord); // Use get directly
    if (completionDown) {
      maxStage = Math.max(maxStage, completionDown.stage);
    }
  }

  return maxStage;
}

/**
 * Gets the appropriate fill color for a cell based on its stage
 * @param stage The stage number (0-5)
 * @param theme The theme object
 * @returns The fill color for the cell
 */
function getCellFillColor(stage: number, theme: typeof crosswordTheme): string {
  switch (stage) {
    case 1: return theme.completionStage1Background;
    case 2: return theme.completionStage2Background;
    case 3: return theme.completionStage3Background;
    // --- ADDED MISSING CASES ---
    case 4: return theme.completionStage4Background;
    case 5: return theme.completionStage5Background;
    // --- END ADDED CASES ---
    default: return theme.cellBackground; // Default background if stage is 0 or invalid
  }
}

/**
 * Draws the game result to a canvas and returns it as a Blob.
 * @param canvas The canvas element to draw on
 * @param data The data required for drawing
 * @returns A Promise that resolves to a Blob (PNG) or null if an error occurs
 */
export async function drawResultToCanvas(
  canvas: HTMLCanvasElement,
  data: CanvasData
): Promise<Blob | null> {
  // Keep existing logs for now if needed for verification
  console.log('%c[canvasRenderer] drawResultToCanvas called', 'color: green;');

  try {
    // Define constants
    const PADDING = 20;
    const FONT_SIZE_TIME = 24;
    const FONT_SIZE_INFO = 16;
    const LINE_HEIGHT = 1.5; // Relative line height multiplier
    const INFO_LINE_MARGIN_TOP = 5; // Space between time and info line
    const GRID_MARGIN_TOP = 15; // Space between info line and grid

    // Set dimensions using predefined constants and DPR
    const dpr = window.devicePixelRatio || 1;
    const baseWidth = 600;
    const baseHeight = 700;

    const targetWidth = baseWidth * dpr;
    const targetHeight = baseHeight * dpr;

    // Log the dimensions we're attempting to set
    console.log(
      `%c[canvasRenderer] Attempting to set dimensions to: ${targetWidth} x ${targetHeight}`,
      'color: orange; font-weight: bold;'
    );

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Log the dimensions after setting
    console.log(
      `%c[canvasRenderer] Canvas dimensions AFTER setting: ${canvas.width} x ${canvas.height}`,
      'color: purple; font-weight: bold;'
    );

    // Set display size (optional but good practice)
    canvas.style.width = `${baseWidth}px`;
    canvas.style.height = `${baseHeight}px`;

    // Get canvas context AFTER setting dimensions
    const ctx = canvas.getContext('2d');
    console.log(`%c[canvasRenderer] Got 2D context:`, 'color: green;', ctx ? 'Success' : 'FAILED');

    if (!ctx) {
      console.error('Could not get canvas context');
      return null;
    }

    // Scale context AFTER getting it
    ctx.scale(dpr, dpr);

    // Wait for fonts to load if necessary (important if using webfonts)
    // await document.fonts.ready; // Uncomment if using webfonts not loaded by default

    // Use baseWidth and baseHeight (logical pixels) for layout calculations
    const canvasWidth = baseWidth;
    const canvasHeight = baseHeight;

    // Fill canvas background
    ctx.fillStyle = data.theme.gridBackground;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight); // Fill the logical area

    // --- Header & Time Rendering (Layout v4) ---
    ctx.textBaseline = 'top'; // Set for more predictable positioning

    // Draw time (top-right, colored by stage)
    const timeY = PADDING; // Align top edge with padding
    ctx.textAlign = 'right';
    ctx.font = `bold ${FONT_SIZE_TIME}px Arial, sans-serif`; // Example font

    let timeColor;
    switch (data.currentStage) {
      case 1: timeColor = data.theme.completionStage1Background; break;
      case 2: timeColor = data.theme.completionStage2Background; break;
      case 3: timeColor = data.theme.completionStage3Background; break;
      case 4: timeColor = data.theme.completionStage4Background; break; // Added
      case 5: timeColor = data.theme.completionStage5Background; break; // Added
      default: timeColor = data.theme.textColor;
    }
    const formattedTime = formatTime(data.elapsedTime);
    ctx.fillStyle = timeColor;
    const timeX = canvasWidth - PADDING;
    ctx.fillText(formattedTime, timeX, timeY);

    // Draw info line (centered below time)
    const infoY = timeY + FONT_SIZE_TIME + INFO_LINE_MARGIN_TOP; // Position below time
    ctx.textAlign = 'center';
    ctx.font = `${FONT_SIZE_INFO}px Arial, sans-serif`; // Example font
    ctx.fillStyle = data.theme.textColor;

    const puzzleName = data.puzzleData?.title || "Crossle"; // Access title or use placeholder
    const puzzleNumber = data.puzzleNumber || "#1";
    const puzzleTheme = data.puzzleThemeName || "Sales";
    const infoString = `${puzzleName} ${puzzleNumber} - ${puzzleTheme}`;
    const infoX = canvasWidth / 2;
    ctx.fillText(infoString, infoX, infoY);

    // Calculate starting y coordinate for the grid
    const gridStartY = infoY + FONT_SIZE_INFO * LINE_HEIGHT + GRID_MARGIN_TOP; // Use line height for spacing

    // Reset text alignment
    ctx.textAlign = 'left';

    // --- Grid Rendering ---
    const numRows = data.gridData.length;
    const numCols = numRows > 0 ? data.gridData[0].length : 0;

    if (numRows === 0 || numCols === 0) {
      console.error('Invalid grid dimensions (0 rows or cols).');
      return null;
    }

    const availableWidth = canvasWidth - (2 * PADDING);
    const availableHeight = canvasHeight - gridStartY - PADDING;

    if (availableWidth <= 0 || availableHeight <= 0) {
      console.error('Not enough available space calculated for the grid', { availableWidth, availableHeight, gridStartY });
      return null;
    }

    // Calculate cell size (integer pixels)
    const cellSize = Math.floor(Math.min(
      availableWidth / numCols,
      availableHeight / numRows
    ));

    if (cellSize <= 0) {
       console.error('Calculated cell size is zero or negative', { cellSize });
       return null;
    }

    const gridWidth = numCols * cellSize;
    const gridHeight = numRows * cellSize;
    const gridStartX = PADDING + (availableWidth - gridWidth) / 2; // Center horizontally
    const gridOffsetY = gridStartY; // Align top

    // Log layout calculations (optional - keep if needed)
    console.log('%c[canvasRenderer] Calculated Layout:', 'color: green;', {
       numRows, numCols, availableWidth, availableHeight, cellSize, gridWidth, gridHeight,
       gridStartX, gridOffsetY
    });

    // Render cells
    ctx.lineWidth = 1; // Set border width
    ctx.strokeStyle = data.theme.cellBorder;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const cellData = data.gridData[row][col];
        const x = gridStartX + (col * cellSize);
        const y = gridOffsetY + (row * cellSize);

        if (!cellData.used) {
          // Non-playable cell - fill with background color explicitly
          // This prevents issues if background wasn't perfectly cleared
          ctx.fillStyle = data.theme.gridBackground;
          ctx.fillRect(x, y, cellSize, cellSize);
          // Optional: Draw a different border or no border for unused cells
          // ctx.strokeRect(x, y, cellSize, cellSize); // Example: Same border
        } else {
          // Playable cell
          const maxStage = findMaxStageForCell(cellData, data.completedWords);
          const fillColor = getCellFillColor(maxStage, data.theme);

          // Log cell coloring (optional - keep if needed)
          // if (maxStage > 0) {
          //   console.log(`%c[canvasRenderer] Cell R${row}C${col}: Applying Fill -> maxStage=${maxStage}, color=${fillColor}`, 'color: orange;');
          // }

          ctx.fillStyle = fillColor;
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeRect(x, y, cellSize, cellSize); // Draw border for playable cells
        }
      }
    }

    // --- Blob Conversion ---
    console.log(
      `%c[canvasRenderer] Final canvas buffer size before toBlob: ${canvas.width} x ${canvas.height}`,
      'color: blue; font-weight: bold;',
      `(DPR: ${dpr})`
    );
    console.log('%c[canvasRenderer] Attempting canvas.toBlob conversion...', 'color: green;');

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('%c[canvasRenderer] canvas.toBlob successful.', 'color: green;');
          resolve(blob);
        } else {
          console.error(
            `%c[canvasRenderer] canvas.toBlob callback received null. Canvas dimensions: ${canvas.width}x${canvas.height}`,
            'color: red;'
          );
          resolve(null);
        }
      }, 'image/png');
    });
  } catch (error) {
    console.error('%c[canvasRenderer] Error during canvas rendering:', 'color: red;', error);
    return null;
  }
}