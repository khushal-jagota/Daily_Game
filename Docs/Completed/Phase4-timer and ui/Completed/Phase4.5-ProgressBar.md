# Phase 4.5 Plan: Stage Progress Bar (Refined with Tracking)

**Document Version:** 1.3
**Date:** [Current Date]

## 1. Overall Goal

To implement a horizontal depletion progress bar, placed immediately to the right of the `TimerDisplay` (`[Timer] [Bar]`). The bar represents the time remaining within the current completion stage (1-5), draining from right-to-left. It appears rendered but inactive (empty/neutral background) before the game starts, becomes 100% full (using Stage 1 color, consistent with TimerDisplay's Stage 0 handling) the moment the game starts, and freezes its state upon game completion.

## 2. Prerequisites

*   Completed Phase 4 codebase.
*   Functional `useTimer` hook returning `elapsedTime` and `currentStage`.
*   Functional `TimerDisplay` component styling Stage 0 and Stage 1 identically.
*   Defined stage thresholds/colors in the theme.
*   Game completion logic working.
*   Visibility of Timer/Bar area likely controlled by `isGameStarted` in `App.tsx`.

## 3. Implementation Steps

### Step 4.5.1: Define Stage Thresholds Constant

*   **File:** `src/Timer/hooks/useTimer.ts`
*   **Goal:** Centralize stage time thresholds.
*   **Implementation:**
    *   [x] Define `STAGE_THRESHOLDS = [0, 30, 70, 120, 180];`.
    *   [x] Export the constant (`export const`).
    *   [x] Refactor internal `calculateStage` function to use `STAGE_THRESHOLDS`.
*   **Test:**
    *   [x] Code Review & Consistency Check with `calculateStage`.
*   **Notes:**
    ```
    Successfully defined and exported STAGE_THRESHOLDS constant. Refactored the internal calculateStage function to use this constant, ensuring consistency and improving maintainability. Verified logic remains identical to previous hardcoded values.
    ```

### Step 4.5.2: Calculate `stageTimeRemainingRatio` in `useTimer`

*   **File:** `src/Timer/hooks/useTimer.ts`
*   **Goal:** Calculate remaining time ratio (1.0 down to 0.0).
*   **Implementation:**
    *   [x] Import `STAGE_THRESHOLDS`.
    *   [x] Define `calculateStageTimeRemainingRatio` function inside the hook.
    *   [x] Handle Stage 0 (return 1.0).
    *   [x] Handle Stage 5 (return 1.0).
    *   [x] Calculate ratio `1 - (timeElapsedInStage / stageDuration)` for Stages 1-4.
    *   [x] Clamp result between 0.0 and 1.0 (`Math.max/min`).
    *   [x] Call the function using current `elapsedTime` and `currentStage`.
    *   [x] Ensure calculation uses frozen state values on completion (verified based on existing hook structure).
*   **Test:**
    *   [x] Logic Review & Test via Console Logs (Verified expected behavior: start=1.0, decrease, reset, Stage 0/5=1.0, freeze).
*   **Notes:**
    ```
    Implemented the calculateStageTimeRemainingRatio function within the useTimer hook. It correctly handles Stage 0 and Stage 5 returning 1.0. For stages 1-4, it accurately calculates the depletion ratio based on stage thresholds and elapsed time, clamping the result. Verified via logging that the ratio behaves as expected throughout the timer lifecycle, including freezing on completion.
    ```

### Step 4.5.3: Update `useTimer` Return Value

*   **File:** `src/Timer/hooks/useTimer.ts`
*   **Goal:** Expose the new ratio.
*   **Implementation:**
    *   [x] Update `UseTimerReturn` interface definition (add `stageTimeRemainingRatio: number;`).
    *   [x] Add JSDoc comment for the new property.
    *   [x] Modify the hook's final return statement to include `stageTimeRemainingRatio`.
*   **Test:**
    *   [x] TypeScript check & DevTools inspection (Verified component compiles and hook returns the new value).
*   **Notes:**
    ```
    Successfully updated the UseTimerReturn interface and the hook's return statement to include stageTimeRemainingRatio. Documentation added. Verified via type checking and runtime inspection that the hook now correctly exports the calculated ratio.
    ```

### Step 4.5.4: Create `StageProgressBar` Styled Components

*   **File:** `src/Timer/components/StageProgressBar.tsx`
*   **Goal:** Define visual structure and styling.
*   **Implementation:**
    *   [ ] Define `ProgressBarContainer` styled-component (outer: size, neutral bg, border, radius, position, overflow).
    *   [ ] Define `ProgressBarFill` styled-component (inner: absolute position `right:0`, width based on `$ratio`, dynamic `background-color` based on `$stage`).
    *   [ ] Ensure `background-color` switch handles `case 0:` and `case 1:` identically (Stage 1 color).
*   **Test:**
    *   [ ] Render in isolation (Storybook/Test Page) with various props (`$ratio`, `$stage`) to verify appearance, colors, and right-to-left drain.
*   **Notes:**
    ```
    {/* Add implementation notes here */}
    ```

### Step 4.5.5: Implement `StageProgressBar` Component Logic

*   **File:** `src/Timer/components/StageProgressBar.tsx`
*   **Goal:** Connect props to styled components.
*   **Implementation:**
    *   [ ] Define component props interface: `{ ratio: number; currentStage: number; isGameActive: boolean; }`.
    *   [ ] Render `ProgressBarContainer`.
    *   [ ] Conditionally render `ProgressBarFill` inside container based on `props.isGameActive`.
    *   [ ] Pass `props.ratio` as `$ratio` and `props.currentStage` as `$stage` to `ProgressBarFill`.
*   **Test:**
    *   [ ] Render in isolation. Verify fill appears/disappears based on `isGameActive`. Verify props are passed correctly.
*   **Notes:**
    ```
    {/* Add implementation notes here */}
    ```

### Step 4.5.6: Create `TimerBarContainer` Layout Component

*   **File:** `src/Timer/components/TimerBarContainer.tsx` (or `src/Layout/components.ts`)
*   **Goal:** Define Flexbox container.
*   **Implementation:**
    *   [ ] Create `TimerBarContainer` styled-component (`display: flex`, `align-items: center`, `gap`).
*   **Test:**
    *   [ ] Visual inspection during integration step.
*   **Notes:**
    ```
    {/* Add implementation notes here */}
    ```

### Step 4.5.7: Integrate into `App.tsx`

*   **File:** `src/App.tsx`
*   **Goal:** Render timer and progress bar together.
*   **Implementation:**
    *   [ ] Import `StageProgressBar`, `TimerBarContainer`.
    *   [ ] Retrieve `{ ..., stageTimeRemainingRatio }` from `useTimer`.
    *   [ ] Wrap `TimerDisplay` and `StageProgressBar` in `<TimerBarContainer>`.
    *   [ ] Pass correct props to both components (`elapsedTime`, `currentStage`, `isVisible` to TimerDisplay; `ratio`, `currentStage`, `isGameActive` to ProgressBar).
    *   [ ] Ensure `TimerBarContainer` visibility and layout within `AppWrapper` are correct.
*   **Test:**
    *   [ ] Rigorous Manual E2E Testing (Inactive state, active state on start, drain direction, color changes, refill, Stage 5, freeze, layout).
*   **Notes:**
    ```
    {/* Add implementation notes here */}
    ```

## 4. Deliverables

*   Updated `useTimer` hook.
*   New `StageProgressBar` component (`.tsx`).
*   New `TimerBarContainer` component (`.tsx`).
*   Integration into `App.tsx`.
*   Updated Manual Testing Checklist.

## 5. Estimate

*   ~1-2 Developer Days.

---