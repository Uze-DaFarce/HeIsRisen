## 2025-05-24 - Canvas Redraw Optimization in Phaser
**Learning:** In Phaser `update()` loops, blindly redrawing to a `RenderTexture` (e.g., for a magnifying glass effect) every frame is a significant performance waste, especially when the input (mouse/touch) is static.
**Action:** Implemented a dirty-check pattern: `if (!inputDirty && !contentDirty) return;`.
**Insight:** Video backgrounds (`contentDirty = true`) require continuous redraws, but static image backgrounds (`contentDirty = false`) can skip rendering entirely when the user is idle. This saves GPU cycles and battery life on mobile devices.
**Verification:** Verified using Playwright by injecting a spy on `zoomedView.clear()` and asserting call count is 0 when input is static.
