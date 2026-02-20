import os
from playwright.sync_api import sync_playwright
import time

def verify_visual():
    print("Starting visual verification...")
    screenshot_path = "/home/jules/verification/settings_panel.png"
    os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        width = 1280
        height = 720
        context = browser.new_context(viewport={'width': width, 'height': height})
        page = context.new_page()

        try:
            page.goto("http://127.0.0.1:8080/index.html")
            page.wait_for_selector("canvas", state="visible", timeout=10000)
            time.sleep(5)

            # Open settings
            page.evaluate("""() => {
                const game = window.game;
                const uiScene = game.scene.getScene('UIScene');
                uiScene.openSettings();
            }""")

            time.sleep(1) # Wait for panel to appear

            # Take screenshot
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Verification FAILED: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_visual()
