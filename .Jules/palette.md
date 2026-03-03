## 2024-05-22 - Map Interaction Feedback
**Learning:** Invisible hit areas on maps leave users guessing; adding a simple hover outline significantly improves discoverability.
**Action:** Ensure all interactive zones, especially non-rectangular ones, have a visual hover state (outline or tint).

## 2024-05-25 - Consistent Interaction Feedback
**Learning:** Users expect consistent feedback across scenes. Since `MapScene` provided hover outlines and cursor scaling, the absence of these in `EggZamRoom` made the interactive zones feel broken or undiscoverable.
**Action:** Reused the feedback pattern (yellow outline + cursor scale) from `MapScene` in `EggZamRoom` to maintain consistency and improve discoverability.

## 2024-05-26 - Center Alignment for Labels
**Learning:** Left-aligned labels in fixed-width containers often look unbalanced or get clipped if the container logic isn't perfect. Centering text (`setOrigin(0.5)`) ensures it expands evenly and looks more polished in score boxes.
**Action:** Use centered origin for HUD labels like scores or counts to prevent visual imbalance.

## 2024-05-27 - Mobile Keyboard Accessibility
**Learning:** Mobile platforms (like tablets, iPads, or Chromebooks in tablet mode) often have physical keyboards attached. Modal accessibility shouldn't be neglected just because the primary input is expected to be touch.
**Action:** Always include keyboard shortcuts (like ESC or ENTER) to close modals and settings panels, even in mobile-specific views.
