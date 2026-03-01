from playwright.sync_api import sync_playwright
import time

def verify_full_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1. Fullscreen / Resizing Test
        # Start with a standard desktop size
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        print("Navigating to game...")
        try:
            page.goto("http://127.0.0.1:8080")
        except Exception as e:
            print(f"Error navigating: {e}")
            return

        # 2. Intro Flow (Mobile Logic)
        print("Checking Intro...")
        try:
            # Check for "Tap anywhere"
            tap_text = page.locator("text=Tap anywhere to start")
            tap_text.wait_for(state="visible", timeout=5000)
            print("Found 'Tap anywhere to start'")

            # Click to transition
            page.mouse.click(960, 540) # Center
            print("Clicked screen")

            # Check for "PLAY NOW" button (appears after delay)
            play_btn = page.locator("text=PLAY NOW")
            play_btn.wait_for(state="visible", timeout=5000)
            print("Found 'PLAY NOW' button")

            play_btn.click()
            print("Clicked PLAY NOW")

        except Exception as e:
            print(f"Intro verification failed: {e}")
            page.screenshot(path="verification/fail_intro.png")

        # 3. Map Scene
        print("Checking Map Scene...")
        try:
            # Wait for score text or map
            page.wait_for_selector("text=0/60", timeout=10000)
            print("Map Scene loaded (Score visible)")
            page.screenshot(path="verification/success_map.png")

            # Resize Window (Simulate maximizing)
            print("Resizing viewport...")
            page.set_viewport_size({"width": 1280, "height": 720})
            time.sleep(1)
            page.screenshot(path="verification/success_map_resized.png")

        except Exception as e:
            print(f"Map Scene verification failed: {e}")
            page.screenshot(path="verification/fail_map.png")

        # 4. Level Entry (Mammoth - Video)
        print("Entering Mammoth Hot Springs (Video Level)...")
        # Click approximate location of Mammoth (top leftish)
        # Based on 1280x720: x=427, y=29.
        # Scaled to current viewport (1280x720) -> 427, 29
        page.mouse.click(450, 50)
        time.sleep(2)
        page.screenshot(path="verification/level_video.png")
        print("Entered Mammoth level")

        # 5. Level Entry (History - Missing Video/Fallback)
        # We need to go back to map first. Click "Egg Zit" button.
        # Button is at (0, 200) scaled.
        print("Returning to Map...")
        page.mouse.click(75, 275) # Approx center of 150x150 button
        time.sleep(2)

        print("Entering Yellowstone History (Fallback Level)...")
        # History coords: x=748, y=438
        page.mouse.click(780, 470)
        time.sleep(2)
        page.screenshot(path="verification/level_fallback.png")
        print("Entered History level")

        browser.close()

if __name__ == "__main__":
    verify_full_flow()
