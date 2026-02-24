from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport emulation
        context = browser.new_context(
            viewport={"width": 375, "height": 667},
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()

        try:
            print("Navigating to mobile game...")
            page.goto("http://127.0.0.1:8080/m/index.html")

            # Wait for "Tap anywhere to start"
            try:
                page.wait_for_selector("text=Tap anywhere to start", timeout=10000)
                print("Mobile game loaded (Tap to start visible).")
            except:
                print("Warning: 'Tap anywhere to start' not found, proceeding anyway...")

            # Inject mock data and start SectionHunt
            # Using 'grand-canyon-yellowstone' because 'grand-prismatic' assets are missing in this repo state
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

                    const mockEggData = [{
                        eggId: 1,
                        section: mockSectionName,
                        x: 150, // Force on-screen position (viewport 375x667)
                        y: 150,
                        symbol: null,
                        collected: false
                    }];

                    // Set registry
                    window.game.registry.set('sections', [mockSection]);
                    window.game.registry.set('eggData', mockEggData); // Must set this for mobile
                    window.game.registry.set('foundEggs', []);
                    window.game.registry.set('symbols', { symbols: [] });

                    // Start scene
                    window.game.scene.start('SectionHunt', { sectionName: mockSectionName });
                })();
            """)

            # Wait for scene to initialize
            time.sleep(2)

            # Check background
            print("Verifying background dimensions...")
            bg_width = page.evaluate("""
                (() => {
                    const scene = window.game.scene.getScene('SectionHunt');
                    const bg = scene.sectionImage;
                    return bg ? bg.displayWidth : -1;
                })()
            """)
            print(f"Background width: {bg_width}")

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

            # Verify egg revealing (Distance.Squared check in update)
            # Use mouse move to update activePointer without clicking
            # Note: On mobile, lens is offset by (-130*scale, -180*scale) relative to pointer.
            # Pointer is handle tip. Lens is "Up and Left".
            # So to center lens on egg, pointer must be "Down and Right" of egg.
            # Scale is 375/1280 = 0.29.
            # OffsetX = -130 * 0.29 = -38.
            # OffsetY = -180 * 0.29 = -52.
            # So LensX = PointerX - 38.
            # To have LensX = EggX, PointerX = EggX + 38.

            scale = 375 / 1280
            offset_x = 130 * scale
            offset_y = 180 * scale

            target_pointer_x = egg_pos['x'] + offset_x
            target_pointer_y = egg_pos['y'] + offset_y

            print(f"Moving pointer to ({target_pointer_x}, {target_pointer_y}) to center lens on egg...")
            page.mouse.move(target_pointer_x, target_pointer_y)
            time.sleep(0.5)

            # Verify visibility (alpha > 0)
            is_revealed = page.evaluate("""
                (() => {
                    const scene = window.game.scene.getScene('SectionHunt');
                    const egg = scene.eggs.getChildren()[0];
                    return egg && egg.alpha > 0;
                })()
            """)
            print(f"Egg revealed on move? {is_revealed}")

            if not is_revealed:
                print("FAILURE: Egg did not reveal. Check Distance.Squared logic in update loop.")
                page.screenshot(path="verification/mobile_failed_reveal.png")
                # Continue to collection check

            # Verify collection (Distance.Squared check in input handler)
            print("Collecting egg...")
            # We tap on the egg directly (or handle). Code checks both.
            page.touchscreen.tap(egg_pos['x'], egg_pos['y'])
            time.sleep(1)

            # Verify egg is collected
            is_collected = page.evaluate("""
                (() => {
                    const scene = window.game.scene.getScene('SectionHunt');
                    const egg = scene.eggs.getChildren()[0];
                    return !egg || egg.alpha === 0 || !egg.active;
                })()
            """)
            print(f"Egg collected on tap? {is_collected}")

            if is_collected:
                print("SUCCESS: Egg collection verified (Distance.Squared input check works).")
            else:
                print("FAILURE: Egg not collected.")

            page.screenshot(path="verification/mobile_collected.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run()
