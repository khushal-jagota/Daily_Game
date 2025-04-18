# Phase 5 Plan: Share Feature (Canvas PNG) (Refined)

**Document Version:** 1.1
**Date:** [Current Date]

## 1. Overall Goal

To implement a "Share" button, appearing upon game completion, that generates a PNG image of the full game result (themed title, final timer, complete colored grid) client-side using Canvas. The image should be shareable via `navigator.share` (files) or fallback to download.

## 2. Prerequisites

*   Completed Phase 4.5 codebase.
*   Access to `puzzleData`, `gridData`, `completedWords`, final `elapsedTime`, and `theme` object in `App.tsx` scope upon game completion.

## 3. Implementation Steps

### Step 5.1: Create Feature Folder & Data Interface

*   **Files:** `src/Sharing/`, `src/Sharing/types.ts`
*   **Goal:** Set up structure and define `CanvasData` interface.
*   **Task:** Create folder, `types.ts`, define `CanvasData`.
*   **Test:** Code review, TS check.

### Step 5.2: Implement Canvas Utility - Setup & Background

*   **File:** `src/Sharing/utils/canvasRenderer.ts`
*   **Goal:** Initialize canvas, handle DPI, draw background.
*   **Task:** Create file. Define `drawResultToCanvas`. Get context. Define constants. Implement DPI scaling. Fill background.
*   **Test:** Call function, inspect canvas size & background.

### Step 5.3: Implement Canvas Utility - Text Rendering

*   **File:** `src/Sharing/utils/canvasRenderer.ts`
*   **Goal:** Draw header and timer text.
*   **Task:** Add `await document.fonts.ready`. Implement header text drawing (`fillText`). Implement timer text drawing (format time, `fillText`). Use reasonable font defaults based on Answer 12 or computed styles.
*   **Test:** Call function, inspect canvas text rendering.

### Step 5.4: Implement Canvas Utility - Grid Structure & Blank Cells

*   **File:** `src/Sharing/utils/canvasRenderer.ts`
*   **Goal:** Draw grid outline and non-playable cells.
*   **Task:** Calculate grid position. Loop rows/cols. Calculate cell position. Get cell type. Draw blank cells (background, border). Use theme colors (Answer 14).
*   **Test:** Call function, inspect grid structure and blank cells.

### Step 5.5: Implement Canvas Utility - Playable & Completed Cells

*   **File:** `src/Sharing/utils/canvasRenderer.ts`
*   **Goal:** Draw playable cells with stage colors.
*   **Task:** Inside grid loop: Draw playable cells. Get `cellKey`, lookup `completionData`. Determine `fillColor` (stage color or default cell background). Fill cell. Draw border.
*   **Test:** Call function with mock completion data. Inspect colored cells.

### Step 5.6: Create `ShareButton` Component - Structure & State

*   **File:** `src/Sharing/components/ShareButton.tsx`
*   **Goal:** Set up button component basics.
*   **Task:** Create file. Define `ShareButtonProps`. Import hooks. Add basic component structure, button rendering, state hooks (`isSharing`, `error`). Add empty `onClick`.
*   **Test:** Render button in isolation.

### Step 5.7: Implement `ShareButton` - Canvas Generation Call

*   **File:** `src/Sharing/components/ShareButton.tsx`
*   **Goal:** Trigger canvas rendering on click.
*   **Task:** Import `drawResultToCanvas`. Implement `handleShareClick`: set loading state, create canvas, call `await drawResultToCanvas` in try/catch, reset loading state.
*   **Test:** Click button, use debugger/logs to verify `drawResultToCanvas` runs.

### Step 5.8: Implement `ShareButton` - Blob Creation & `navigator.share`

*   **File:** `src/Sharing/components/ShareButton.tsx`
*   **Goal:** Convert canvas to blob, use Web Share API.
*   **Task:** Implement `canvas.toBlob` call. Inside callback: handle null blob, create `File`, define `shareData` (with UTM link in text), implement `if (navigator.share...)` logic, call `await navigator.share` in try/catch.
*   **Test:** Test on supported mobile device. Verify share sheet opens with image/text.

### Step 5.9: Implement `ShareButton` - Download Fallback

*   **File:** `src/Sharing/components/ShareButton.tsx`
*   **Goal:** Implement download link fallback.
*   **Task:** Implement `else` block for share check. Inside: create object URL, create/click temporary link, revoke URL. Wrap in try/catch.
*   **Test:** Test on desktop. Verify PNG download starts. Check file.

### Step 5.10: Implement `ShareButton` - UI Feedback

*   **File:** `src/Sharing/components/ShareButton.tsx`
*   **Goal:** Provide user feedback.
*   **Task:** Update button text/disabled state based on `isSharing`. Display `error` message. Consider success feedback.
*   **Test:** Verify button states and messages.

### Step 5.11: Ensure `gridData` Accessibility

*   **File:** `src/GameFlow/state/useGameStateManager.ts` / `src/App.tsx`
*   **Goal:** Confirm `gridData` is available to pass to `ShareButton`.
*   **Task:** Check if `useGameStateManager` returns `gridData`. If not, update hook return type/value.
*   **Test:** Verify `gameState.gridData` access in `App.tsx`.

### Step 5.12: Integrate `ShareButton` into `App.tsx`

*   **File:** `src/App.tsx`
*   **Goal:** Display button conditionally and pass props.
*   **Task:** Import `ShareButton`. Render conditionally on `gameState.isGameComplete`. Pass required props (`puzzleData`, `gridData`, `completedWords`, `elapsedTime`).
*   **Test:** Manual E2E: Complete game, verify button appears, test full share/download cycle, verify image accuracy.

## 4. Deliverables

*   New `Sharing` feature folder and components/utils.
*   Potential update to `useGameStateManager`.
*   Integration into `App.tsx`.
*   Updated Manual Testing Checklist.

## 5. Estimate

*   ~2-3 Developer Days.

---