from playwright.sync_api import sync_playwright
import time
import os
import sys

def run_verification(screenshot_name="gameplay_visual_check.png"):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use standard desktop resolution
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Capture console errors to debug internal game issues
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

        # Default to local http-server
        url = "http://127.0.0.1:8080"
        try:
            page.goto(url)
            page.wait_for_load_state('networkidle')
        except Exception as e:
            print(f"Error loading page: {e}")
            return

        print("Page loaded.")

        # Click to start (bypasses interaction gate)
        page.mouse.click(640, 360)
        time.sleep(1)

        # Wait for 'Play Now' button animation
        time.sleep(3.5)
        # Click 'Play Now'
        page.mouse.click(640, 580)
        print("Clicked Play Now.")
        time.sleep(2)

        # Inject Mock Data for Deterministic Testing
        # This ensures we always have eggs and sections loaded even if bypassing MapScene logic
        print("Injecting registry data for SectionHunt...")
        page.evaluate("""() => {
            window.game.registry.set('foundEggs', []);
            // Mock section with known egg positions if needed, or rely on game logic
            // For now, we trust the game's loader to populate 'sections' via MapScene or MainMenu
            // But to be safe if jumping straight to scene:
            if (!window.game.registry.get('sections')) {
                 window.game.registry.set('sections', [
                    { name: 'mammoth-hot-springs', eggs: [1, 2, 3] }
                ]);
            }
            window.game.registry.set('symbols', { symbols: [] });
        }""")

        # Jump to SectionHunt
        print("Injecting scene start for SectionHunt (mammoth-hot-springs)...")
        page.evaluate("window.game.scene.keys['MapScene'].scene.start('SectionHunt', { sectionName: 'mammoth-hot-springs' })")
        time.sleep(2)

        # Verification 1: Video Background
        is_video = page.evaluate("""() => {
            const scene = window.game.scene.getScene('SectionHunt');
            return scene && scene.sectionVideo && scene.sectionVideo.active && scene.sectionVideo.width > 0;
        }""")
        print(f"Video Background Active: {is_video}")

        # Verification 2: Check Offsets and Alignment
        # Center mouse to verify lens tracking
        page.mouse.move(640, 360)
        time.sleep(0.5)

        positions = page.evaluate("""() => {
            const scene = window.game.scene.getScene('SectionHunt');
            if (scene.zoomedView && scene.magnifyingGlass) {
                 return {
                    glassX: scene.magnifyingGlass.x,
                    glassY: scene.magnifyingGlass.y,
                    viewX: scene.zoomedView.x,
                    viewY: scene.zoomedView.y,
                    viewW: scene.zoomedView.width
                 };
            }
            return null;
        }""")
        print(f"State at Pointer(640, 360): {positions}")

        if positions:
            # Check ZoomedView is Fixed at Pointer
            if abs(positions['viewX'] - 640) < 5 and abs(positions['viewY'] - 360) < 5:
                 print("SUCCESS: ZoomedView is anchored at Pointer.")
            else:
                 print("FAILURE: ZoomedView is NOT anchored at Pointer.")

            # Check Magnifying Glass Sprite Offset (-15, -30)
            expectedGlassX = 640 - 15
            expectedGlassY = 360 - 30
            if abs(positions['glassX'] - expectedGlassX) < 5 and abs(positions['glassY'] - expectedGlassY) < 5:
                 print("SUCCESS: Glass Sprite is correctly offset (-15, -30).")
            else:
                 print(f"FAILURE: Glass Sprite is NOT offset correctly. Expected ({expectedGlassX}, {expectedGlassY})")

            # Check Dimensions
            if positions['viewW'] == 100:
                 print("SUCCESS: ZoomedView size is 100x100.")
            else:
                 print(f"FAILURE: ZoomedView size is {positions['viewW']} (Expected 100).")

        # Verification 3: Egg Collection
        # Find an active egg and click it
        egg_info = page.evaluate("""() => {
             const scene = window.game.scene.getScene('SectionHunt');
             if (!scene || !scene.eggs) return null;
             const egg = scene.eggs.getChildren().find(e => e.active);
             if (egg) return { x: egg.x, y: egg.y, id: egg.getData('eggId') };
             return null;
        }""")

        if egg_info:
             print(f"Found active egg at {egg_info}")
             # Click exactly where the egg is (since View is at Pointer)
             targetX = egg_info['x']
             targetY = egg_info['y']
             print(f"Clicking at target: {targetX}, {targetY}")

             page.mouse.move(targetX, targetY)
             time.sleep(0.5)
             page.mouse.click(targetX, targetY)
             time.sleep(1)

             is_collected = page.evaluate(f"""() => {{
                 const found = window.game.registry.get('foundEggs');
                 return found.some(e => e.eggId === {egg_info['id']});
             }}""")

             if is_collected:
                  print("SUCCESS: Egg collected successfully!")
             else:
                  print("FAILURE: Egg was not collected.")
        else:
             print("WARNING: No active eggs found to test collection.")

        if not os.path.exists('verification'):
            os.makedirs('verification')

        output_path = os.path.join('verification', screenshot_name)
        page.screenshot(path=output_path)
        print(f"Screenshot saved to {output_path}")

        browser.close()

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "gameplay_visual_check.png"
    run_verification(name)
