## 2025-05-15 - Consistent Interaction Patterns
**Learning:** The project uses a custom `addButtonInteraction` function to provide scale-based hover/press feedback for `Phaser.GameObjects`. This pattern was missing from the `UIScene` Gear Icon, leading to an inconsistent feel.
**Action:** Always check for existing interaction helpers (like `addButtonInteraction`) before implementing custom pointer handlers. When modifying UI elements, ensure they use the established feedback patterns (scale 1.1x on hover, 0.9x on press) for a cohesive experience.

## 2025-05-15 - Asset Orientation and Hotspots
**Learning:** When using directional cursors (like a pointing finger), `setOrigin` and `angle` must be coordinated to align the visual "tip" with the logical "hotspot" (coordinates). Specifically, flipping a cursor 180 degrees requires changing the origin (e.g., from Center or Top-Left to match the new Tip location relative to the unrotated texture) so that the GameObject's `(x, y)` position remains the click point.
**Action:** When rotating interaction cursors, visualize the texture in local space. If the "hotspot" moves due to rotation, adjust `setOrigin` so the pivot point remains the desired hotspot (e.g., the fingertip).
