## 2024-05-22 - Map Interaction Feedback
**Learning:** Invisible hit areas on maps leave users guessing; adding a simple hover outline significantly improves discoverability.
**Action:** Ensure all interactive zones, especially non-rectangular ones, have a visual hover state (outline or tint).

## 2024-05-25 - Consistent Interaction Feedback
**Learning:** Users expect consistent feedback across scenes. Since `MapScene` provided hover outlines and cursor scaling, the absence of these in `EggZamRoom` made the interactive zones feel broken or undiscoverable.
**Action:** Reused the feedback pattern (yellow outline + cursor scale) from `MapScene` in `EggZamRoom` to maintain consistency and improve discoverability.

## 2024-05-26 - Center Alignment for Labels
**Learning:** Left-aligned labels in fixed-width containers often look unbalanced or get clipped if the container logic isn't perfect. Centering text (`setOrigin(0.5)`) ensures it expands evenly and looks more polished in score boxes.
**Action:** Use centered origin for HUD labels like scores or counts to prevent visual imbalance.

## 2024-05-27 - Responsive HUD Text Scaling
**Learning:** HUD text that looks perfect on mobile often overlaps or feels overwhelmingly large when the same codebase is rendered on desktop (e.g., in responsive or emulated views). Checking `sys.game.device.os.desktop` allows for nuanced typography adjustments.
**Action:** Always verify HUD element spacing on both mobile and desktop contexts, and use device detection to scale font sizes and adjust vertical spacing to prevent overlap.

## 2026-03-02 - Keyboard Accessibility Parity on Mobile
**Learning:** Dismissing overlays or modals via keyboard commands (like `ESC`) is frequently missed on "mobile" environments where touch is presumed to be the only input. However, on tablets or mobile web views attached to external keyboards, the absence of basic keyboard navigation feels broken. Parity with the desktop codebase on core keyboard interactions is essential.
**Action:** Ensure standard keyboard dismiss handlers (`ESC`, `ENTER` for modals) are consistently applied across both desktop and mobile scenes.

## 2026-03-09 - HTML5 Canvas Screen Reader Announcement
**Learning:** HTML5 canvas games wrapped in an ARIA container are not automatically announced by screen readers unless the container receives focus. Using `tabindex="-1"` and `.focus({ preventScroll: true, focusVisible: false })` programmatically focuses the container for screen readers without capturing the natural tab sequence or flashing an outline.
**Action:** Always make the ARIA container programmatically focusable (`tabindex="-1"`) and call `.focus()` during the window load event. Provide a clear `:focus-visible` CSS outline to ensure keyboard users have visual feedback when they intentionally tab to the game.
