# Phase 2.75: Refactor `useGameStateManager` Utilities & Standardize Cell Key

*   **Goal:** Refactor internal logic within `useGameStateManager` to improve maintainability, reduce redundancy, and increase clarity by extracting reusable helper functions for movement calculation/validation and selection state updates. Standardize cell key generation by defining and applying a `getCellKey` utility. This prepares the codebase for the cleaner integration of Phase 3 logic.
*   **Rationale:** Addresses the growing complexity of action handlers identified during Phase 2.5 review. Extracts repeated logic patterns (movement calculation, cell validation, state setting) into dedicated, testable (or at least isolated) units, making the primary action handlers easier to read and modify. Centralizes cell key format generation for consistency. Reduces risk when adding new features in Phase 3.
*   **Testing Strategy Note:** While formal unit tests for the hook are still deferred, this refactoring might make it easier to add unit tests for the *extracted helper functions* later. This phase relied primarily on rigorous E2E regression testing (Step 2.75.3) to ensure no behavioral changes were introduced. Console logging within helpers was used during development.
*   **Version Control:** All work for Phase 2.75 was done on a dedicated feature branch off the completed Phase 2.5 branch, with logical commits after each step.

---

### Step 2.75.1: Define & Integrate `calculateAndValidateTargetCell` Helper

*   **Status:** Completed
*   **Scope:** Define a new internal helper function within `useGameStateManager` that handles coordinate calculation, boundary checks, and cell validation. Update relevant action handlers (`handleGuessInput`, `handleBackspace`) to use this helper.
*   **Reason:** To centralize the logic for determining a valid target cell based on direction and delta, removing duplication from input and backspace handlers.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  **Define Helper:** Created internal function `calculateAndValidateTargetCell` handling coordinate math, boundary checks (using `gridData`), and cell validation (using `getCellData` + `.used`). Returns `UsedCellData | null`.
    2.  **Refactor `handleGuessInput`:** Replaced manual calculation/validation with call to `calculateAndValidateTargetCell(..., 1)`.
    3.  **Refactor `handleBackspace`:** Replaced manual calculation/validation with call to `calculateAndValidateTargetCell(..., -1)`.
    4.  **Review Dependencies:** Ensured handler dependencies were updated correctly after refactoring.
*   **Test:** Code review completed. Static analysis passed. Development testing performed with console logs verifying helper output. Full E2E regression testing performed in Step 2.75.3.
*   **Check:**
    *   [x] Helper Function Defined
    *   [x] `handleGuessInput` Refactored
    *   [x] `handleBackspace` Refactored
    *   [x] Dependencies Reviewed
    *   [x] Test Checked (Static, Dev Logs, E2E Regression)
*   **Notes:**
    ```text
    Successfully centralized core movement calculation and validation. Boundary checks implemented. `handleMoveRequest` left unmodified due to different input structure (dRow/dCol).
    ```

---

### Step 2.75.2: Define & Integrate `updateSelectionState` Helper

*   **Status:** Completed
*   **Scope:** Define a new internal helper function within `useGameStateManager` that centralizes the calls to the four selection state setters (`setSelectedRow`, `setSelectedCol`, `setCurrentDirection`, `setCurrentNumber`). Update all relevant action handlers to use this helper.
*   **Reason:** To significantly reduce boilerplate code related to updating the selection state, improving readability and maintainability of multiple action handlers.
*   **Implementation:** In `src/GameFlow/state/useGameStateManager.ts`:
    1.  **Define Helper:** Created internal helper `updateSelectionState` wrapped in `useCallback`, calling the four setters, with setters as dependencies.
    2.  **Refactor `handleMoveRequest`:** Replaced setter block with `updateSelectionState(...)`. Updated dependencies.
    3.  **Refactor `handleMoveToClueStart`:** Replaced setter block with `updateSelectionState(...)`. Updated dependencies.
    4.  **Refactor `handleCellSelect`:** Replaced setter block with `updateSelectionState(...)`. Updated dependencies.
    5.  **Refactor `handleBackspace`:** Replaced setter block within `if (prevCellData)` with `updateSelectionState(...)`. Updated dependencies.
    6.  **Refactor `handleGuessInput`:** Determined `nextNumber` within `if (nextCellData)` block and replaced previous focus logic with call to `updateSelectionState(...)`. Updated dependencies.
    7.  **Update Dependencies:** Verified individual setters removed and `updateSelectionState` added where appropriate. `handleDirectionToggle` correctly remained unchanged.
*   **Test:** Code review completed. Static analysis passed. Development testing performed with console logs verifying helper call and subsequent state changes in DevTools. Full E2E regression testing performed in Step 2.75.3.
*   **Check:**
    *   [x] Helper Function Defined & Memoized
    *   [x] `handleMoveRequest` Refactored
    *   [x] `handleMoveToClueStart` Refactored
    *   [x] `handleCellSelect` Refactored
    *   [x] `handleBackspace` Refactored
    *   [x] `handleGuessInput` Refactored
    *   [x] Dependencies Updated & Verified
    *   [x] Test Checked (Static, Dev Logs, E2E Regression)
*   **Notes:**
    ```text
    Successfully reduced significant code duplication across multiple handlers. Confirmed `UsedCellData` type includes 'across' and 'down' number properties for `handleGuessInput` logic.
    ```

---

### Step 2.75.3: E2E Regression Testing

*   **Status:** Completed
*   **Scope:** Perform comprehensive end-to-end testing of all features related to movement, selection, and input to ensure the refactoring did not introduce any behavioral regressions.
*   **Reason:** To validate that the extracted helper functions were integrated correctly and the application's core interactions remain unchanged from the user's perspective.
*   **Implementation:** Re-executed the full E2E testing checklist defined at the end of Phase 2.5, including specific checks for boundary conditions, intersections, and focus management related to the refactored movement logic. Validation blocking using manipulated `completedWords` state was re-verified.
*   **Test:** Executed detailed E2E test scenarios. Monitored console logs for expected helper function calls and state updates via DevTools. Compared behavior against the verified state at the end of Phase 2.5. **No regressions were found.**
*   **Check:**
    *   [x] Arrow Key Movement Verified
    *   [x] Backspace Verified
    *   [x] Guess Input Auto-Move Verified
    *   [x] Cell Click Behavior Verified
    *   [x] Clue Jumping Verified
    *   [x] Direction Toggling Verified
    *   [x] Validation Blocking Verified
    *   [x] Test Checked (Runtime E2E, DevTools, Logs)
*   **Notes:**
    ```text
    Critical validation step completed successfully. Refactoring confirmed to have preserved existing functionality.
    ```

---

### Step 2.75.4: Define and Apply `getCellKey` Utility

*   **Status:** Completed
*   **Scope:** Define a simple, shared utility function for generating standardized cell keys (e.g., "R{row}C{col}") and apply it within `CrosswordGrid.tsx`.
*   **Reason:** To ensure consistency in key generation between rendering and state mapping (planned for Phase 3), improving maintainability.
*   **Implementation:**
    1.  **Define Utility:** Created `getCellKey` in `src/lib/utils.ts`: `export const getCellKey = (row: number, col: number): string => \`R${row}C${col}\`;`.
    2.  **Apply in `CrosswordGrid.tsx`:** Imported utility and updated `<Cell>` key prop: `key={getCellKey(row, col)}`.
*   **Test:** Code review completed. Static analysis passed. Simple unit test added for `getCellKey`. Quick visual check in the running app confirmed grid rendering was unaffected. React DevTools confirmed correct key format applied.
*   **Check:**
    *   [x] Utility Function Defined
    *   [x] Location Chosen & Exported
    *   [x] `CrosswordGrid.tsx` Updated to Use Utility
    *   [x] Test Checked (Review, Static, Unit, Quick Visual)
*   **Notes:**
    ```text
    Standardized cell key generation. Applied in CrosswordGrid. Prepares for consistent usage in Phase 3. The utility function format "R{row}C{col}" maintains the exact same format as before, ensuring compatibility while enabling reuse.
    ```

---

### Step 2.75.5: Update Phase Documentation

*   **Status:** Completed
*   **Scope:** Mark Phase 2.75 as complete, documenting the successful refactoring and standardization.
*   **Reason:** Record progress and architectural improvements.
*   **Implementation:** Tracking documents updated. Noted the successful extraction of `calculateAndValidateTargetCell` and `updateSelectionState` helpers in `useGameStateManager` and the standardization of cell key generation via the new `getCellKey` utility applied in `CrosswordGrid`.
*   **Check:**
    *   [x] Docs Updated
*   **Notes:**
    ```text
    Phase 2.75 complete. Codebase structure improved, ready for Phase 3 feature implementation.
    ```

---