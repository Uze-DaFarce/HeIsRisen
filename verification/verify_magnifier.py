from playwright.sync_api import sync_playwright
import time
import os

def get_current_scene(page):
    return page.evaluate("""() => {
        const scenes = window.game.scene.getScenes(true);
        return scenes.length > 0 ? scenes[0].sys.settings.key : 'None';
    }""")

def wait_for_scene(page, scene_name, timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        current = get_current_scene(page)
        if current == scene_name:
            print(f"Verified scene: {scene_name}")
            return True
        time.sleep(0.5)
    print(f"Timeout waiting for scene: {scene_name}. Current: {get_current_scene(page)}")
    return False

def verify_desktop():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        print("Desktop: Navigating...")
        page.goto("http://localhost:8080/index.html")
        time.sleep(2)

        # Wait for MainMenu
        if not wait_for_scene(page, "MainMenu"):
             # Maybe we need to click to start audio context or something
             print("Desktop: Clicking to ensure focus...")
             page.mouse.click(640, 360)

        # Click Start
        print("Desktop: Clicking Start Text...")
        page.mouse.click(640, 680)
        time.sleep(1)

        # Skip Intro
        print("Desktop: Pressing Space to skip intro...")
        page.keyboard.press("Space")

        if not wait_for_scene(page, "MapScene"):
            print("Desktop: Failed to reach MapScene")
            page.screenshot(path="/home/jules/verification/desktop_failed_map.png")
            browser.close()
            return

        # Click Mammoth Hot Springs
        print("Desktop: Clicking Mammoth Hot Springs...")
        page.mouse.click(472, 76)

        if not wait_for_scene(page, "SectionHunt"):
            print("Desktop: Failed to reach SectionHunt")
            page.screenshot(path="/home/jules/verification/desktop_failed_section.png")
            browser.close()
            return

        # Move mouse to an egg location (randomly distributed, but let's try a few spots or just center)
        # Eggs are 200-1270, 100-710.
        # Let's move around to trigger updates
        print("Desktop: Moving mouse to find eggs...")
        for i in range(5):
            page.mouse.move(300 + i*100, 300 + i*50)
            time.sleep(0.1)

        # Take screenshot of magnifying glass effect
        output_path = "/home/jules/verification/verification_desktop.png"
        page.screenshot(path=output_path)
        print(f"Desktop screenshot saved to {output_path}")
        browser.close()

def verify_mobile():
    with sync_playwright() as p:
        device = p.devices['iPhone 11 landscape']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(**device)
        page = context.new_page()

        print("Mobile: Navigating...")
        page.goto("http://localhost:8080/m/index.html")
        time.sleep(2)

        width = page.viewport_size['width']
        height = page.viewport_size['height']

        # Start sequence
        print("Mobile: Tapping to Start...")
        page.mouse.click(width / 2, height * 0.8)
        time.sleep(1)
        print("Mobile: Tapping Play Now...")
        page.mouse.click(width / 2, height * 0.8)
        time.sleep(1)

        # Skip Intro
        print("Mobile: Pressing Space...")
        page.keyboard.press("Space")

        if not wait_for_scene(page, "MapScene"):
            print("Mobile: Failed to reach MapScene")
            page.screenshot(path="/home/jules/verification/mobile_failed_map.png")
            browser.close()
            return

        # Click Mammoth Hot Springs (scaled)
        # Mobile scale logic: min(width/1280, height/720)
        # In MapScene for mobile (m/main.js), let's assume same logic as desktop but scaled.
        # Actually mobile map scene might use full width.
        # Let's guess coordinates based on 472/1280 ratio.
        clickX = (472 / 1280) * width
        clickY = (76 / 720) * height

        print(f"Mobile: Clicking Mammoth at {clickX}, {clickY}...")
        page.mouse.click(clickX, clickY)

        if not wait_for_scene(page, "SectionHunt"):
            print("Mobile: Failed to reach SectionHunt")
            # Maybe the click was off. Try slightly different spot?
            page.mouse.click(clickX + 20, clickY + 20)
            if not wait_for_scene(page, "SectionHunt", timeout=5):
                 page.screenshot(path="/home/jules/verification/mobile_failed_section.png")
                 browser.close()
                 return

        # Move mouse/touch
        print("Mobile: Moving cursor...")
        for i in range(5):
            page.mouse.move(width/2 + i*20, height/2 + i*10)
            time.sleep(0.1)

        output_path = "/home/jules/verification/verification_mobile.png"
        page.screenshot(path=output_path)
        print(f"Mobile screenshot saved to {output_path}")
        browser.close()

if __name__ == "__main__":
    if not os.path.exists("/home/jules/verification"):
        os.makedirs("/home/jules/verification")
    try:
        verify_desktop()
        verify_mobile()
    except Exception as e:
        print(f"Verification failed: {e}")
