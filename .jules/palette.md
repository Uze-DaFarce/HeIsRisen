## 2025-05-15 - Consistent Interaction Patterns
**Learning:** The project uses a custom `addButtonInteraction` function to provide scale-based hover/press feedback for `Phaser.GameObjects`. This pattern was missing from the `UIScene` Gear Icon, leading to an inconsistent feel.
**Action:** Always check for existing interaction helpers (like `addButtonInteraction`) before implementing custom pointer handlers. When modifying UI elements, ensure they use the established feedback patterns (scale 1.1x on hover, 0.9x on press) for a cohesive experience.
