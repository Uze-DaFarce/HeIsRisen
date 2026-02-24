from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use http://127.0.0.1:8080 to avoid IPv6 issues
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        try:
            print("Navigating to game...")
            page.goto("http://127.0.0.1:8080/index.html")

            # Wait for "Click to Start" which implies MainMenu preload is done
            try:
                page.wait_for_selector("text=Click to Start", timeout=10000)
                print("Game loaded (Click to Start visible).")
            except:
                print("Warning: 'Click to Start' not found, proceeding anyway...")

            # Inject mock data and start SectionHunt
            # Using 'grand-canyon-yellowstone' for a reliable SVG asset
            print("Injecting mock data and starting SectionHunt...")
            page.evaluate("""
                (() => {
                    // Mock data
                    const mockSectionName = 'grand-canyon-yellowstone';
                    const mockSection = {
                        name: mockSectionName,
                        eggs: [1],
                        coords: { x:0, y:0, width:100, height:100 }
                    };

                    // Set registry
                    window.game.registry.set('sections', [mockSection]);
                    window.game.registry.set('foundEggs', []);
                    window.game.registry.set('symbols', { symbols: [] });

                    // Start scene
                    window.game.scene.start('SectionHunt', { sectionName: mockSectionName });
                })();
            """)

            # Wait for scene to initialize
            time.sleep(2)

             # Locate egg
            print("Locating egg...")
            egg_pos = page.evaluate("""
                (() => {
                    const scene = window.game.scene.getScene('SectionHunt');
                    if (!scene || !scene.eggs) return null;
                    const egg = scene.eggs.getChildren()[0];
                    return egg ? { x: egg.x, y: egg.y } : null;
                })()
            """)

            if not egg_pos:
                print("FAILURE: No egg found in scene.")
                return

            print(f"Egg located at ({egg_pos['x']}, {egg_pos['y']})")

            # Move mouse far away
            page.mouse.move(0, 0)
            time.sleep(0.5)

            # Verify egg is hidden initially (distance check)
            is_visible_far = page.evaluate("""
                (() => {
                    const scene = window.game.scene.getScene('SectionHunt');
                    const egg = scene.eggs.getChildren()[0];
                    return egg && egg.alpha > 0;
                })()
            """)
            print(f"Egg visible when far? {is_visible_far}")

            # Move mouse close to reveal
            print(f"Moving mouse to ({egg_pos['x']}, {egg_pos['y']}) to reveal egg...")
            page.mouse.move(egg_pos['x'], egg_pos['y'])
            time.sleep(0.5)

            # Verify visibility again
            is_visible_close = page.evaluate("""
                (() => {
                    const scene = window.game.scene.getScene('SectionHunt');
                    const egg = scene.eggs.getChildren()[0];
                    return egg && egg.alpha > 0;
                })()
            """)
            print(f"Egg visible when close? {is_visible_close}")

            if not is_visible_close:
                print("FAILURE: Egg did not reveal. Check Distance.Squared logic in update loop.")
                page.screenshot(path="verification/desktop_failed_reveal.png")
                return

            # Take screenshot of revealed egg
            page.screenshot(path="verification/desktop_reveal.png")
            print("Screenshot saved: verification/desktop_reveal.png")

            # Click to collect (Distance.Squared check in input handler)
            print("Clicking to collect egg...")
            page.mouse.click(egg_pos['x'], egg_pos['y'])
            time.sleep(1)

            # Verify egg is collected (removed from scene or alpha 0)
            is_collected = page.evaluate("""
                (() => {
                    const scene = window.game.scene.getScene('SectionHunt');
                    const egg = scene.eggs.getChildren()[0];
                    return !egg || egg.alpha === 0 || !egg.active;
                })()
            """)
            print(f"Egg collected? {is_collected}")

            if is_collected:
                print("SUCCESS: Egg collection verified (Distance.Squared input check works).")
            else:
                print("FAILURE: Egg not collected.")

            page.screenshot(path="verification/desktop_collected.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
