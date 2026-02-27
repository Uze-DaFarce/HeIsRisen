from playwright.sync_api import sync_playwright
import time

def verify_intro_and_video_background():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to test fullscreen scaling
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        print("Navigating to game...")
        # Assuming the game is served at localhost:8080
        page.goto("http://127.0.0.1:8080")

        # 1. Verify "Click to Start" Overlay
        print("Verifying 'Click to Start' overlay...")
        try:
            page.wait_for_selector('text=Click to Start', timeout=10000)
            page.screenshot(path="verification/1_intro_overlay.png")
            print("Screenshot 1 taken: intro_overlay.png")
        except Exception as e:
            print(f"Failed to find 'Click to Start' overlay: {e}")
            page.screenshot(path="verification/1_failed_overlay.png")

        # 2. Click to Start Video
        print("Clicking to start video...")
        try:
            page.click('text=Click to Start')
            # Wait a bit for video to potentially start
            time.sleep(2)
            page.screenshot(path="verification/2_video_playing.png")
            print("Screenshot 2 taken: video_playing.png")
        except Exception as e:
            print(f"Failed to click start: {e}")


        # 3. Skip Video to get to Map
        print("Skipping video...")
        page.keyboard.press("Space")

        # 4. Wait for Map Scene
        print("Waiting for Map Scene...")
        # Wait for a known element in MapScene (e.g., score text or a zone)
        try:
            page.wait_for_selector('text=0/60', timeout=10000)
            time.sleep(1)
            page.screenshot(path="verification/3_map_scene.png")
            print("Screenshot 3 taken: map_scene.png")
        except Exception as e:
            print(f"Failed to reach MapScene: {e}")
            page.screenshot(path="verification/3_failed_map.png")

        # 5. Enter a Level (Mammoth Hot Springs)
        # Coordinates from map_sections.json: x: 427, y: 29, width: 90, height: 94
        # Calculate center: 427 + 45 = 472, 29 + 47 = 76
        print("Clicking Mammoth Hot Springs...")
        page.mouse.click(472, 76)

        # 6. Verify SectionHunt with Video Background
        print("Waiting for SectionHunt...")
        time.sleep(4) # Give ample time for video to load and play

        # Take a screenshot of the level
        page.screenshot(path="verification/4_level_mammoth.png")
        print("Screenshot 4 taken: level_mammoth.png")

        # Verify video element count
        video_count = page.locator('video').count()
        print(f"Number of video elements in DOM: {video_count}")

        browser.close()

if __name__ == "__main__":
    verify_intro_and_video_background()
