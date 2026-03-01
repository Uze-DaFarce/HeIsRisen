from playwright.sync_api import sync_playwright
import time

def verify_egg_zam_restoration():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a non-standard size to test centering
        page = browser.new_page(viewport={'width': 1000, 'height': 800})

        print("Navigating to game...")
        try:
            page.goto("http://127.0.0.1:8080")
        except Exception as e:
            print(f"Error navigating: {e}")
            return

        # 1. Skip Intro
        print("Skipping intro...")
        try:
            page.mouse.click(500, 400) # Center tap
            time.sleep(4) # Wait for button
            play_btn = page.locator("text=PLAY NOW")
            play_btn.wait_for(state="visible", timeout=5000)
            play_btn.click()
            print("Into MapScene")
        except Exception as e:
            print(f"Intro failed: {e}")
            return

        # 2. Enter EggZamRoom via UI Button
        print("Clicking Eggs Ammin Haul button...")
        # In MapScene, UI is scaled.
        # But we can try finding the egg-zam-room texture if we were using image locators,
        # but clicking blindly near the bottom-left/middle might work if we assume standard layout.
        # Button is at (0, 200) scaled. In 1000x800, scale is approx min(1000/1280, 800/720) = 0.78
        # Pos: 0, 156. Size: 107x117.
        page.mouse.click(50, 200)

        time.sleep(3)
        page.screenshot(path="verification/egg_zam_room.png")
        print("Screenshot taken: egg_zam_room.png")

        # 3. Check for specific EggZam elements
        # We expect "Correct: 0" text
        try:
            page.wait_for_selector("text=Correct: 0", timeout=5000)
            print("Verified EggZamRoom UI text present")
        except:
            print("Failed to find EggZam text")

        browser.close()

if __name__ == "__main__":
    verify_egg_zam_restoration()
