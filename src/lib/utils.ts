/**
 * Generates a standardized key for a cell based on its row and column.
 * Format: "R{row}C{col}" - example: "R2C3" for row 2, column 3
 * @param row - The row index of the cell
 * @param col - The column index of the cell
 * @returns A string key uniquely identifying the cell position
 */
export const getCellKey = (row: number, col: number): string => `R${row}C${col}`; 