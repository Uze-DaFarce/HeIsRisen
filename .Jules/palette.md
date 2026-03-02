## 2024-05-22 - Map Interaction Feedback
**Learning:** Invisible hit areas on maps leave users guessing; adding a simple hover outline significantly improves discoverability.
**Action:** Ensure all interactive zones, especially non-rectangular ones, have a visual hover state (outline or tint).

## 2024-05-25 - Consistent Interaction Feedback
**Learning:** Users expect consistent feedback across scenes. Since `MapScene` provided hover outlines and cursor scaling, the absence of these in `EggZamRoom` made the interactive zones feel broken or undiscoverable.
**Action:** Reused the feedback pattern (yellow outline + cursor scale) from `MapScene` in `EggZamRoom` to maintain consistency and improve discoverability.

## 2024-05-26 - Center Alignment for Labels
**Learning:** Left-aligned labels in fixed-width containers often look unbalanced or get clipped if the container logic isn't perfect. Centering text (`setOrigin(0.5)`) ensures it expands evenly and looks more polished in score boxes.
**Action:** Use centered origin for HUD labels like scores or counts to prevent visual imbalance.

## 2026-03-02 - Keyboard Accessibility Parity on Mobile
**Learning:** Dismissing overlays or modals via keyboard commands (like `ESC`) is frequently missed on "mobile" environments where touch is presumed to be the only input. However, on tablets or mobile web views attached to external keyboards, the absence of basic keyboard navigation feels broken. Parity with the desktop codebase on core keyboard interactions is essential.
**Action:** Ensure standard keyboard dismiss handlers (`ESC`, `ENTER` for modals) are consistently applied across both desktop and mobile scenes.
