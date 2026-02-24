
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        # Emulate iPhone 12 (Landscape)
        iphone_12 = p.devices['iPhone 12'].copy()
        # Swap width/height for landscape
        iphone_12['viewport'] = {
            'width': iphone_12['viewport']['height'],
            'height': iphone_12['viewport']['width']
        }
        # Ensure is_mobile is true (it should be already)
        context = browser.new_context(**iphone_12)
        page = context.new_page()

        # Log console messages
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        try:
            print("Navigating to mobile game...")
            # Navigate to the mobile version
            page.goto("http://localhost:8080/m/index.html")

            # Wait for game to initialize
            print("Waiting for game load...")
            page.wait_for_timeout(3000)

            # --- START SEQUENCE ---
            # Tap center to start audio context / video
            viewport = page.viewport_size
            print(f"Viewport: {viewport}")
            center_x = viewport['width'] / 2
            center_y = viewport['height'] / 2

            print("Tapping Center to Start...")
            page.mouse.click(center_x, center_y)

            # Wait for Intro Video delay (approx 4s)
            print("Waiting for Intro Video / Play Now button...")
            page.wait_for_timeout(4000)

            # Click 'Play Now' button (approx location)
            # The button appears centered horizontally, somewhat lower vertically.
            print("Clicking Play Now...")
            page.mouse.click(center_x, center_y) # Tapping center usually skips or interacts if button is centered.
            # Actually, let's look for the canvas element to be sure.

            # Wait for MapScene / Game Start
            print("Waiting for MapScene...")
            page.wait_for_timeout(3000)

            # --- CALCULATE GEAR POSITION ---
            # Get canvas bounding client rect to handle letterboxing/centering
            print("Calculating Canvas Offset...")
            canvas_box = page.evaluate("() => { const c = document.querySelector('canvas'); const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }")
            print(f"Canvas Bounds: {canvas_box}")

            # Game Config Width/Height (internal resolution)
            game_config = page.evaluate("() => { return { width: window.game.config.width, height: window.game.config.height }; }")
            print(f"Game Config: {game_config}")

            # Calculate Scale Factor (Canvas Display Size / Game Config Size)
            scale_x = canvas_box['width'] / game_config['width']
            scale_y = canvas_box['height'] / game_config['height']

            # Gear Icon Position (Top Right in Game Coordinates)
            # The gear is at approx (width - 60, 60) in internal coordinates.
            # Let's verify exact position if possible, but approximation is okay if hit area is large.
            # In m/main.js, gear is at (this.cameras.main.width - 50, 50).
            gear_game_x = game_config['width'] - 50
            gear_game_y = 50

            # Convert to Viewport Coordinates
            gear_viewport_x = canvas_box['x'] + (gear_game_x * scale_x)
            gear_viewport_y = canvas_box['y'] + (gear_game_y * scale_y)

            print(f"Clicking Gear Icon at Viewport Coords: ({gear_viewport_x}, {gear_viewport_y})...")
            page.mouse.click(gear_viewport_x, gear_viewport_y)

            # Wait for Settings Panel animation
            page.wait_for_timeout(1000)

            # --- VERIFY SETTINGS PANEL ---
            print("Verifying Settings Panel Visibility...")
            is_settings_visible = page.evaluate("() => { const uiScene = window.game.scene.getScene('UIScene'); return uiScene && uiScene.settingsContainer && uiScene.settingsContainer.visible; }")
            print(f"Settings Visible: {is_settings_visible}")

            if is_settings_visible:
                print("SUCCESS: Settings panel opened!")
            else:
                print("FAILURE: Settings panel did not open.")

            # Screenshot
            page.screenshot(path="verification_mobile_settings_fixed.png")
            print("Screenshot saved to verification_mobile_settings_fixed.png")

        except Exception as e:
            print(f"Test failed with error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    run()
