# Codebase Documentation

## Project Structure
- `index.html`: Desktop entry point.
- `main.js`: Desktop game logic.
- `m/index.html`: Mobile entry point.
- `m/main.js`: Mobile game logic.

## Platform Differences (Crucial)
The gameplay mechanics for `SectionHunt` (the magnifying glass search) are **intentionally different** between Desktop and Mobile to account for input methods (Mouse vs Touch) and screen size.

### Desktop (`main.js`)
- **Input:** Mouse.
- **Magnifying Glass:**
  - Uses a `RenderTexture` with an internal Camera (`zoomedView.camera`).
  - Masking is applied via `createGeometryMask` on a Graphics object.
  - The lens is smaller (Radius: 50, Diameter: 100).
  - The zoom level is moderate (2x).
  - Interaction relies on mouse hover and precise clicking.

### Mobile (`m/main.js`)
- **Input:** Touch.
- **Magnifying Glass:**
  - Uses manual coordinate calculation (`(x - scrollX) * zoom`) because `RenderTexture` cameras behave differently on some mobile contexts or for performance reasons.
  - **Scale:** All gameplay elements (Cursor, Eggs, Lens) are scaled up (approx 2x) to be touch-friendly.
  - **Lens:** Significantly larger to allow seeing under the finger.
  - **Egg Spawning:** Constrained to visible bounds (50px margin) to prevent eggs from being unclickable at the edges.
  - **Helpers:** Includes an idle help prompt ("Eggs left here: X") to assist users on small screens.

**DO NOT MERGE THESE LOGICS.**
Future optimizations must respect these differences. "Fixing" the desktop version to look like the mobile version (or vice-versa) without explicit instruction is a regression.
