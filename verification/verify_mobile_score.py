import time
from playwright.sync_api import sync_playwright

def verify_score():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the mobile game
        page.goto("http://127.0.0.1:8080/m/index.html")

        # Wait for the game canvas to load
        page.wait_for_selector('canvas')

        # Give the game a moment to render the MapScene
        time.sleep(2)

        # Take a screenshot
        screenshot_path = "verification/mobile_score_mapscene.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_score()
