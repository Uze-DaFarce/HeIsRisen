
import os
import time
from playwright.sync_api import sync_playwright

def reproduce_issue():
    print("Starting reproduction script...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport
        context = browser.new_context(
            viewport={'width': 812, 'height': 375},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        try:
            # Inject mock data into registry to isolate SectionHunt
            # We'll use a standard section 'old-faithful'
            page.goto("http://localhost:8080/m/index.html")
            page.wait_for_selector("canvas", state="visible", timeout=10000)
            time.sleep(2) # Wait for initial load

            # Setup console listener to catch the specific error
            error_found = False
            def handle_console(msg):
                nonlocal error_found
                if msg.type == "error":
                    text = msg.text
                    if "distToClickSq is not defined" in text or "ReferenceError" in text:
                        print(f"CAUGHT EXPECTED ERROR: {text}")
                        error_found = True

            page.on("console", handle_console)

            # Catch unhandled exceptions as well
            page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

            # Inject mock data and start scene
            # Note: We need to use a section that actually exists or fallback will fail.
            # old-faithful exists in map_sections.json, but maybe not as SVG if 404.
            # Let's check which sections exist.
            # Assuming 'grand-prismatic' exists based on code.

            page.evaluate("""() => {
                const game = window.game;
                if (!game) return;

                // Mock Registry Data
                game.registry.set('foundEggs', []);
                game.registry.set('currentScore', 0);
                game.registry.set('highScore', 0);
                game.registry.set('musicVolume', 0.5);
                game.registry.set('sfxVolume', 0.5);
                game.registry.set('ambientVolume', 0.5);

                // Mock Sections
                const sections = [
                    { name: 'grand-prismatic', eggs: [1, 2, 3] }
                ];
                game.registry.set('sections', sections);

                // Mock Egg Data
                const eggData = [
                    { eggId: 1, section: 'grand-prismatic', x: 400, y: 200, symbol: { name: 'test', filename: 'egg-1' }, collected: false },
                    { eggId: 2, section: 'grand-prismatic', x: 500, y: 300, symbol: { name: 'test', filename: 'egg-2' }, collected: false },
                    { eggId: 3, section: 'grand-prismatic', x: 600, y: 200, symbol: { name: 'test', filename: 'egg-3' }, collected: false }
                ];
                game.registry.set('eggData', eggData);

                // Mock Symbols (minimal)
                game.registry.set('symbols', { symbols: [] });

                // Start Scene
                game.scene.start('SectionHunt', { sectionName: 'grand-prismatic' });
            }""")

            time.sleep(3) # Wait for scene to start and assets to load

            # Simulate a click near an egg (x=400, y=200)
            print("Simulating click near egg...")

            # Click near the first egg
            page.mouse.click(400, 200)

            time.sleep(1) # Allow event to process

            if error_found:
                print("SUCCESS: Reproduction script caught the bug.")
            else:
                print("FAILURE: Did not catch the expected error.")
                # Debug info
                egg_visible = page.evaluate("""() => {
                    const scene = window.game.scene.getScene('SectionHunt');
                    if (!scene || !scene.eggs) return "No Scene/Eggs";
                    const egg = scene.eggs.getChildren()[0];
                    if (!egg) return "No Egg Found";
                    return `Egg Visible: ${egg.visible}, Alpha: ${egg.alpha}, X: ${egg.x}, Y: ${egg.y}`;
                }""")
                print(f"Debug: {egg_visible}")

        except Exception as e:
            print(f"Script Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    reproduce_issue()
