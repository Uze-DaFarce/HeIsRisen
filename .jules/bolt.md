## 2024-05-22 - [Phaser 3 Asset Loading Redundancy]
**Learning:** Phaser 3 scenes re-run `preload()` every time they are started. If assets (like 60+ images) are defined in `preload()` of a gameplay scene that is revisited, they are re-requested and re-processed, causing significant performance overhead and network traffic.
**Action:** Centralize static/global asset loading in a dedicated `Boot` or `MainMenu` scene. In gameplay scenes, remove the redundant `load.image` calls or wrap them in `if (!this.textures.exists(key))` checks. This pattern was applied to both the desktop (`main.js`) and mobile (`m/main.js`) versions of the game.

## 2024-05-22 - [Map Section SVG Preloading]
**Learning:** Loading large SVG assets for map sections on-demand in `SectionHunt` caused a delay when entering each section. Since there are a small number of sections (11), preloading them all in `MainMenu` eliminates this friction.
**Action:** Added a `filecomplete` listener in `MainMenu` to iterate over the `map_sections` JSON and preload all section SVGs upfront. Removed individual SVG loading from `SectionHunt`.

## 2025-05-24 - [Squared Distance Optimization]
**Learning:** Checking distance for visibility in an `update()` loop (running 60fps) using `Math.sqrt` (via `Phaser.Math.Distance.Between`) is computationally expensive when applied to multiple objects. For simple radius checks, comparing squared distances avoids the square root operation entirely.
**Action:** Replaced `Phaser.Math.Distance.Between(x1, y1, x2, y2) < radius` with `Phaser.Math.Distance.Squared(x1, y1, x2, y2) < radius * radius` in the `SectionHunt` update loops and click handlers in both Desktop and Mobile versions.
