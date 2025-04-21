# Phase 6 Plan: Share Feature with Modal Preview (Layout v4)

**Document Version:** 1.6
**Date:** [Current Date]
**Status:** Final Approved Plan for Phase 6

## 1. Overall Goal

Upon game completion, automatically display a modal window previewing the generated PNG image of the game result. The PNG includes the time (top-right, colored by stage), puzzle info (centered below time), and the colored grid (no letters). Provide "Share" and "Download" options within the modal.

## 2. Prerequisites

*   Completed Phase 5 codebase.
*   Access to `puzzleData`, `gridData: GridData`, `completedWords: Map<string, { stage: number }>`, final `elapsedTime: number`, final `currentStage: number`, and `theme` object (`crosswordTheme`) in `App.tsx` scope upon game completion.

## 3. Key Decisions & Context

*   **Modal Preview:** A modal will display the generated PNG result.
*   **PNG Layout (v4):**
    *   Top-Right: Formatted Time (MM:SS), colored based on `currentStage`.
    *   Below Time: Centered text line combining Puzzle Name, Number, and Theme.
    *   Main Area: Colored crossword grid (no letters).
*   **Placeholders:** If `puzzleData` lacks specific fields, use: Name="Crossle", Number="#1", Theme="Sales". Assumes future dynamic data.
*   **Time Color:** Use `theme.completionStageXBackground` colors for time text. **Action:** Verify contrast during testing.
*   **Implementation Order:** Implement and validate `canvasRenderer` utility first, then integrate into the `ResultModal`.
*   **Canvas Rendering Spike:** Included (**Step 6.4.A**) to de-risk core drawing logic.
*   **Cell Color Logic:** Grid cell colors prioritize the **Latest Stage** of intersecting completed words.
*   **Grid Dimensions:** Derived dynamically from `gridData`.
*   **Error Monitoring & Automated Testing:** Explicitly **excluded**. Manual testing is the sole verification method.

## 4. Implementation Steps (Canvas Renderer First)

### --- Part 1: Core Canvas Image Generation ---

*(Focus on completing and validating these steps first)*

### Step 6.1: Create Feature Folder & Data Interface

*   **Files:** `src/Sharing/`, `src/Sharing/types.ts`
*   **Goal:** Set up structure, define `CanvasData` interface.
*   **Task:** Create folder, `types.ts`. Define `CanvasData` interface including `puzzleData: CluesInput`, `gridData: GridData`, `completedWords: Map<string, { stage: number }>`, `elapsedTime: number`, `currentStage: number`, `theme: typeof crosswordTheme`. Add optional `puzzleNumber?: string | number`, `puzzleThemeName?: string` based on anticipated `puzzleData` structure.
*   **Test:** Code review, TS check.

### Step 6.2: Implement Canvas Utility - Setup & Background

*   **File:** `src/Sharing/utils/canvasRenderer.ts`
*   **Goal:** Initialize canvas, handle DPI, draw background.
*   **Task:** Create file. Define `drawResultToCanvas` function signature `async (canvas: HTMLCanvasElement, data: CanvasData) => Promise<Blob | null>`. Get 2D context. Define constants (padding, font sizes, line heights). Implement DPI scaling. Fill canvas background using `data.theme.gridBackground`.
*   **Test:** Call function, inspect canvas element size & background.

### Step 6.3: Implement Canvas Utility - Header & Time Rendering (Layout v4)

*   **File:** `src/Sharing/utils/canvasRenderer.ts`
*   **Goal:** Draw the time (top-right, colored) and info line (centered below).
*   **Task:**
    *   Use `document.fonts.ready` if needed. Define `y` position for the top elements.
    *   **Time Drawing:**
        *   Set `ctx.textAlign = 'right'`. Calculate `x` based on canvas width minus padding.
        *   Determine `timeColor` based on `data.currentStage` mapping to `data.theme.completionStageXBackground` colors. Set `ctx.fillStyle = timeColor`.
        *   Format `data.elapsedTime` to MM:SS string.
        *   Draw time text: `ctx.fillText(formattedTime, x, y)`.
    *   **Info Line Drawing:**
        *   Set `ctx.textAlign = 'center'`. Calculate `x` as canvas center. Calculate `y` for the line below the time (consider font size/line height).
        *   Set `ctx.fillStyle = data.theme.textColor`.
        *   Construct info string: Use `data.puzzleData.title || "Crossle"`, `data.puzzleNumber || "#1"`, `data.puzzleThemeName || "Sales"`. Format as "Name #Number - Theme".
        *   Draw info text: `ctx.fillText(infoString, x, y)`.
    *   Reset `ctx.textAlign` if needed. Calculate starting `y` coordinate for the grid below this header section.
*   **Test:** Call function. Inspect canvas text: verify time position/color, info line position/content, standard text color. **Verify time color contrast against background.**

### Step 6.4: Implement Canvas Utility - Grid Rendering & Blob Output (PRIORITY 1)

*   **File:** `src/Sharing/utils/canvasRenderer.ts`
*   **Goal:** Draw colored grid (no letters, latest stage priority), convert canvas to Blob.
*   **Task:**
    *   **A. Spike (De-risk Task):** Focus *only* on basic grid/cell rendering with "Latest Stage" color logic using mock data, within calculated bounds below the header. Validate feasibility.
    *   **B. Full Implementation (Latest Stage Logic):**
        *   Determine grid dimensions from `data.gridData`. Calculate cell size/positioning to fit *below the header* area.
        *   Iterate `data.gridData`. Draw non-playable cells.
        *   For playable cells: Find `maxStage` from `data.completedWords` for intersecting words. Determine `fillColor` based on `maxStage` (0=background, 1=stage1Color...). Draw cell (`fillRect`) and border (`strokeRect`).
    *   **C. Blob Conversion:** After all drawing, implement `canvas.toBlob(..., 'image/png')` within a `Promise` wrapper in `drawResultToCanvas` to return the `Blob` or `null`.
*   **Test:** Call `drawResultToCanvas` with real game data. Validate returned `Blob`. **Verify image accuracy:** layout (time, info, grid), colors (**latest stage** rule), no letters. Test error handling.

### --- Part 2: Modal Implementation & Integration ---

*(Begin after `drawResultToCanvas` is working reliably)*

### Step 6.5: Create `ResultModal` Component - Structure & Basic Display

*   **Files:** `src/Sharing/components/ResultModal.tsx`
*   **Goal:** Set up basic modal structure.
*   **Task:** Create component. Define props (`isOpen`, `onClose`, `canvasData`). Basic layout (overlay, content box). State (`isLoading`, `error`, `imageUrl`, `imageBlob`). Conditional loading/error/placeholder display. Static buttons. `onClose` handler.
*   **Test:** Render in isolation. Verify layout, open/close, state display.

### Step 6.6: Implement Modal Visibility Control in `App.tsx`

*   **File:** `src/App.tsx`
*   **Goal:** Control modal opening/closing.
*   **Task:** Add `isResultModalOpen` state. `useEffect` to set `true` on `gameState.isGameComplete`. Prepare `canvasData` (including final `currentStage` and potential `puzzleNumber`/`themeName`). Render `<ResultModal>` conditionally, passing props.
*   **Test:** Complete game. Verify modal opens. Verify closing works.

Okay, Lead Dev. I've added the task to fix the `isOpen` prop warning directly into the description for Step 6.7 in the plan document (v1.6).

Here is the updated Step 6.7 description within Plan v1.6:

---

### Step 6.7: Integrate Canvas Generation & Display into `ResultModal`

*   **File:** `src/Sharing/components/ResultModal.tsx`
*   **Goal:** Generate and display PNG preview inside the modal.
*   **Task:**
    *   Import `drawResultToCanvas`.
    *   **Fix React Warning:** Modify `ModalOverlay` styled-component definition and usage to use the transient prop prefix (`$isOpen`) to prevent the prop from reaching the DOM element.
    *   Implement `useEffect` hook within `ResultModal` that runs when `isOpen` becomes `true` and `canvasData` is available:
        *   Reset internal state (`isLoading`, `error`, `imageUrl`, `imageBlob`). Set `isLoading(true)`.
        *   Create an offscreen canvas element.
        *   Call `const blob = await drawResultToCanvas(canvas, props.canvasData);` in a try/catch block.
        *   On success (`blob` is not null): Create object URL: `const url = URL.createObjectURL(blob)`. Set state: `setImageUrl(url)`, `setImageBlob(blob)`, `setIsLoading(false)`.
        *   On failure (`blob` is null or error caught): Set `setError('Failed to generate image.')`, `setIsLoading(false)`.
        *   **Crucially:** Implement cleanup in the `useEffect` return function: if `imageUrl` exists, call `URL.revokeObjectURL(imageUrl)` to prevent memory leaks.
    *   Conditionally render `<img src={imageUrl} alt="Crossword Result Preview" />` when `imageUrl` is available and not loading/error.
*   **Test:** Complete game. Verify loading, then correct PNG display. Verify error state. Check for memory leaks. Verify React warning for `isOpen` prop is resolved in the console.

### Step 6.8

*   **File:** `src/Sharing/components/ResultModal.tsx`
*   **Goal:** Implement "Share" button.
*   **Task:** Add `handleShare` function. Check `imageBlob`. Create `File`, `shareData`. Call `navigator.share()` in try/catch. Handle states. Disable button when loading/no blob.
*   **Test:** On mobile, test share sheet triggering with correct image/text.

### Step 6.9: Implement Download Logic within `ResultModal`

*   **File:** `src/Sharing/components/ResultModal.tsx`
*   **Goal:** Implement "Download" button.
*   **Task:** Add `handleDownload` function. Check `imageBlob`. Implement download logic (create URL, click `<a>`, revoke URL). Handle states. Disable button when loading/no blob.
*   **Test:** On desktop, test PNG download. Verify file content.

### Step 6.10: Ensure Necessary Data Accessibility

*   **Files:** `useGameStateManager.ts`, `App.tsx`, `useTimer.ts`
*   **Goal:** Confirm required data (`currentStage`, potential puzzle info) is passed.
*   **Task:** Verify `currentStage` is captured correctly in `App.tsx` upon completion and included in `canvasData`. Ensure `puzzleData` structure allows access to info (or placeholders work).
*   **Test:** (Verification Step) Use DevTools/logs in `App.tsx` or `ResultModal` to check `canvasData` contents.

### Step 6.11: Final E2E Testing

*   **File:** N/A (Manual Test Execution)
*   **Goal:** Test the entire integrated flow.
*   **Task:** Comprehensive manual testing: Desktop & Mobile completion. Modal opens, shows loading, correct image preview appears. **Verify image layout (v4) and content accuracy (time color, info line, grid colors).** Test Share, Download, Close buttons. Test error handling. Check console.
*   **Test:** Pass/Fail based on successful execution.

## 5. Deliverables

*   New `Sharing` feature folder (`src/Sharing/`) containing `ResultModal.tsx`, `canvasRenderer.ts`, `types.ts`.
*   Updates to `App.tsx` for modal control and data passing.
*   Updated Manual Testing Checklist (include modal flow, image validation per Layout v4 rules, share/download from modal).

## 6. Estimate

*   **~3 - 4.5 Developer Days.** (Estimate unchanged; complexity shifts within canvas rendering step).