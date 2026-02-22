
import time
from playwright.sync_api import sync_playwright

def verify_gameplay_visual():
    print("Starting Visual Gameplay verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport for m/index.html
        context = browser.new_context(
            viewport={'width': 812, 'height': 375},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        try:
            # 1. Load Mobile Game
            print("Loading Mobile Game...")
            page.goto("http://localhost:8080/m/index.html")
            page.wait_for_selector("canvas", state="visible", timeout=10000)

            # 2. Inject Logic to Start SectionHunt with known egg position
            print("Injecting Test Scenario...")
            page.evaluate("""() => {
                const game = window.game;

                // Mock Data
                game.registry.set('symbols', { symbols: [] });
                game.registry.set('map_sections', [{ name: 'test-section', coords: { x: 0, y: 0, width: 100, height: 100 } }]);

                // Force a single egg at (400, 200)
                const eggData = [{
                    eggId: 1,
                    section: 'test-section',
                    x: 400,
                    y: 200,
                    symbol: null,
                    collected: false
                }];
                game.registry.set('eggData', eggData);
                game.registry.set('foundEggs', []);
                game.registry.set('currentScore', 0);
                game.registry.set('highScore', 0);
                game.registry.set('sections', [{ name: 'test-section', eggs: [1] }]);

                // Start Scene
                game.scene.start('SectionHunt', { sectionName: 'test-section' });
            }""")

            time.sleep(2) # Wait for scene start

            # 3. Move Mouse/Touch to Egg Position to test visibility update
            print("Simulating input to reveal egg...")

            page.evaluate("""() => {
                const scene = window.game.scene.getScene('SectionHunt');
                const scale = scene.gameScale;
                // Reverse engineer pointer pos: lensX = pointer.x - 130*scale
                // We want lensX = 400
                scene.input.activePointer.x = 400 - (-130 * scale);
                scene.input.activePointer.y = 200 - (-180 * scale);
                scene.input.activePointer.isDown = true;
            }""")

            # Trigger update loop manually to be sure
            page.evaluate("""() => {
                window.game.loop.step(Date.now());
                window.game.loop.step(Date.now() + 16);
            }""")

            time.sleep(0.5)

            # 4. Take Screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/gameplay_revealed.png")
            print("Screenshot saved to verification/gameplay_revealed.png")

        except Exception as e:
            print(f"Script Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_gameplay_visual()
