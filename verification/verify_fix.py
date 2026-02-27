from playwright.sync_api import sync_playwright
import time

def verify_intro_and_gameplay():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a desktop viewport size to match user requirements
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        print("Navigating to game...")
        page.goto("http://127.0.0.1:8080")

        print("Waiting for game load...")
        page.wait_for_selector("canvas", timeout=10000)

        # 1. Verify Intro Video Scaling (Before Click)
        print("Checking Intro Video state...")
        time.sleep(2)
        page.screenshot(path="verification/1_intro_initial.png")

        # 2. Click to Start
        print("Clicking to start...")
        page.mouse.click(640, 360)

        # Wait for "PLAY NOW" button to appear (it has a delay of 3s)
        time.sleep(4)
        page.screenshot(path="verification/2_intro_playing.png")

        # Click Play Now
        print("Clicking Play Now...")
        page.mouse.click(640, 600)

        # Wait for MapScene
        time.sleep(2)
        print("In MapScene. Clicking 'Mammoth' (approx top-leftish)...")
        # Click a zone. Mammoth is the first one in list, let's assume valid click coords.
        # Alternatively, simulate the Registry setup and scene start via evaluate if clicking is flaky

        # To simulate a proper "click" on a zone, we can cheat by finding the zone data
        # BUT let's try to be robust.
        # Better: Inject the Registry data needed for SectionHunt and then start it.
        # This mimics what MapScene does.

        page.evaluate("""
            const sections = window.game.cache.json.get('map_sections').map(section => ({ name: section.name, eggs: [] }));
            window.game.registry.set('sections', sections);
            if (!window.game.registry.has('foundEggs')) window.game.registry.set('foundEggs', []);
            window.game.scene.start('SectionHunt', { sectionName: 'mammoth-hot-springs' });
        """)

        print("Entered SectionHunt. Waiting for video/assets...")
        time.sleep(3)

        # 4. Verify Lens Size & Gameplay
        # Move mouse to center
        page.mouse.move(640, 360)
        time.sleep(0.5)
        page.screenshot(path="verification/3_section_hunt_lens.png")

        print("Verification complete.")
        browser.close()

if __name__ == "__main__":
    verify_intro_and_gameplay()
