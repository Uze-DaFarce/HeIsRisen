## 2024-05-22 - [Phaser 3 Input & Playwright Mobile]
**Learning:**
1.  **Phaser 3 Container Draggability:**
    *   Using `container.setInteractive(hitArea, callback, { draggable: true })` does NOT automatically enable dragging.
    *   Correct pattern: Call `container.setInteractive(...)` then explicitly call `scene.input.setDraggable(container)`.
    *   This is critical for mobile sliders using Container wrappers for larger hit areas.

2.  **Playwright Mobile Emulation:**
    *   `iPhone 12 Landscape` is not a valid device descriptor.
    *   To emulate landscape on mobile devices in Playwright, use the base device (e.g., `iPhone 12`) and manually swap the viewport width/height in the context options.

**Action:**
*   Always use `input.setDraggable(obj)` for draggable elements.
*   Use manual viewport swapping for landscape mobile tests.
