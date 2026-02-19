from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)

    # Test Desktop
    print("Testing Desktop...")
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()
    page.goto("http://localhost:8080/")

    # Wait for canvas
    try:
        page.wait_for_selector("canvas", timeout=10000)
    except:
        print("Desktop: Canvas not found!")
        page.screenshot(path="desktop_debug_canvas_fail.png")
        return

    # Wait for game initialization
    page.wait_for_timeout(2000)

    # Verify MainMenu is active
    try:
        is_main_menu = page.evaluate("game.scene.getScene('MainMenu').scene.isActive()")
        if is_main_menu:
            print("Desktop: MainMenu is active.")
        else:
            print("Desktop: MainMenu is NOT active!")
            return
    except Exception as e:
        print(f"Desktop: Failed to access game object: {e}")
        return

    page.screenshot(path="desktop_main_menu.png")

    # Click background (100, 100)
    print("Desktop: Clicking background...")
    page.mouse.click(100, 100)
    page.wait_for_timeout(1000)

    is_main_menu_still = page.evaluate("game.scene.getScene('MainMenu').scene.isActive()")
    if is_main_menu_still:
        print("Desktop: Background click did NOT start game (Correct).")
    else:
        print("Desktop: Background click STARTED game (Incorrect).")

    # Click "Click to Start" text (center is approx 640, 680)
    print("Desktop: Clicking 'Click to Start'...")
    page.mouse.click(640, 680)
    page.wait_for_timeout(2000)

    is_map_scene = page.evaluate("game.scene.getScene('MapScene').scene.isActive()")
    if is_map_scene:
        print("Desktop: MapScene is active (Game Started).")
        page.screenshot(path="desktop_map_scene.png")
    else:
        print("Desktop: MapScene is NOT active (Start Failed).")
        page.screenshot(path="desktop_start_fail.png")

    context.close()

    # Test Mobile
    print("\nTesting Mobile...")
    context_mobile = browser.new_context(viewport={'width': 800, 'height': 400}, is_mobile=True, has_touch=True)
    page_m = context_mobile.new_page()
    page_m.goto("http://localhost:8080/m/")

    try:
        page_m.wait_for_selector("canvas", timeout=10000)
    except:
        print("Mobile: Canvas not found!")
        return

    page_m.wait_for_timeout(2000)

    try:
        is_main_menu_m = page_m.evaluate("game.scene.getScene('MainMenu').scene.isActive()")
        if is_main_menu_m:
            print("Mobile: MainMenu is active.")
        else:
            print("Mobile: MainMenu is NOT active!")
            return
    except Exception as e:
        print(f"Mobile: Failed to access game object: {e}")
        return

    page_m.screenshot(path="mobile_main_menu.png")

    # Tap background (100, 100)
    print("Mobile: Tapping background...")
    page_m.touchscreen.tap(100, 100)
    page_m.wait_for_timeout(1000)

    is_main_menu_still_m = page_m.evaluate("game.scene.getScene('MainMenu').scene.isActive()")
    if is_main_menu_still_m:
        print("Mobile: Background tap did NOT start game (Correct).")
    else:
        print("Mobile: Background tap STARTED game (Incorrect).")

    # Tap "Tap to Start" text (center x is width/2 = 400, y = 650 scaled)
    # Scale calculation in m/main.js: scaleX = 800/1280 = 0.625, scaleY = 400/720 = 0.55. Scale = 0.55.
    # Text y = 650 * 0.55 = 357.5.
    # Text x = 800 / 2 = 400.
    # So tap at (400, 357)

    # Wait, I need to know the scale to tap correctly.
    # I can ask the game for the text position?
    # Or just calculate roughly.
    # scale is min(800/1280, 400/720) = min(0.625, 0.555) = 0.555.
    # y = 650 * 0.555 = 360.

    print("Mobile: Tapping 'Tap to Start' at (400, 360)...")
    page_m.touchscreen.tap(400, 360)
    page_m.wait_for_timeout(2000)

    is_map_scene_m = page_m.evaluate("game.scene.getScene('MapScene').scene.isActive()")
    if is_map_scene_m:
        print("Mobile: MapScene is active (Game Started).")
        page_m.screenshot(path="mobile_map_scene.png")
    else:
        print("Mobile: MapScene is NOT active (Start Failed).")
        page_m.screenshot(path="mobile_start_fail.png")

    context_mobile.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
