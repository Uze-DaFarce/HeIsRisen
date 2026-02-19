from playwright.sync_api import sync_playwright
import time

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1280x720 desktop size
        page = browser.new_page(viewport={'width': 1280, 'height': 720})
        print("Navigating to game...")
        page.goto("http://127.0.0.1:8080")

        # Wait for game canvas
        page.wait_for_selector("canvas")
        print("Canvas found. Waiting for load...")
        time.sleep(5)

        # Screenshot initial state (Settings icon should be smaller/new design)
        # Icon is at width-40, 40 -> 1240, 40
        page.screenshot(path="verification/gear_icon.png", clip={'x': 1200, 'y': 0, 'width': 80, 'height': 80})
        print("Gear icon screenshot saved.")

        # Simulate click to start (should stop intro music if playing, start background)
        # But we can't verify audio in headless. We can verify settings UI.

        # Click settings
        print("Clicking settings gear...")
        page.mouse.click(1240, 40)
        time.sleep(1)

        # Screenshot settings panel
        page.screenshot(path="verification/settings_panel_cursor.png")
        print("Settings panel screenshot saved.")

        browser.close()

if __name__ == "__main__":
    verify_changes()
