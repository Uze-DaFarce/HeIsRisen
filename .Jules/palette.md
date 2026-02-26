## 2024-05-22 - Map Interaction Feedback
**Learning:** Invisible hit areas on maps leave users guessing; adding a simple hover outline significantly improves discoverability.
**Action:** Ensure all interactive zones, especially non-rectangular ones, have a visual hover state (outline or tint).

## 2024-05-25 - Consistent Interaction Feedback
**Learning:** Users expect consistent feedback across scenes. Since `MapScene` provided hover outlines and cursor scaling, the absence of these in `EggZamRoom` made the interactive zones feel broken or undiscoverable.
**Action:** Reused the feedback pattern (yellow outline + cursor scale) from `MapScene` in `EggZamRoom` to maintain consistency and improve discoverability.
