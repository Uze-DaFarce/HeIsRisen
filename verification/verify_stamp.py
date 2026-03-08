from playwright.sync_api import sync_playwright
import time
import sys

def verify_stamp():
    print("Starting frontend verification for Level-Complete Stamp and Volumes...")
    with sync_playwright() as p:
        # ---- 1. Test Desktop View ----
        print("Testing Desktop View...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Mock the state BEFORE navigating to ensure localStorage is ready when page loads
        page.goto("http://localhost:8080/")
        page.evaluate("""
            window.localStorage.setItem('musicVolume', '0.2');
            window.localStorage.setItem('ambientVolume', '0.2');
            window.localStorage.setItem('sfxVolume', '0.2');
        """)
        # reload page so settings take effect
        page.reload()

        page.wait_for_selector("canvas", timeout=10000)
        time.sleep(2)

        # Click to bypass the first start screen
        page.mouse.click(640, 360)
        time.sleep(2)

        # We are on the intro video screen, click again to bypass to map scene
        page.mouse.click(640, 360)
        time.sleep(2)

        # Inject completed state directly into the MapScene registry
        # We must use the correct data structures
        page.evaluate("""
            const mapScene = window.game.scene.scenes.find(s => s.scene.key === 'MapScene');
            if (mapScene) {
                const eggDataArray = mapScene.registry.get('eggData');
                if (eggDataArray) {
                    const gpEggs = eggDataArray.filter(e => e.section === 'grand-prismatic');
                    // map them to the format foundEggs expects: { eggId: ... }
                    const formattedGpEggs = gpEggs.map(e => ({ eggId: e.eggId }));
                    window.game.scene.scenes[0].registry.set('foundEggs', formattedGpEggs);
                    mapScene.scene.restart();
                }
            }
        """)

        print("Waiting for MapScene restart...")
        time.sleep(3)
        page.screenshot(path="verification/desktop_stamp.png")
        print("Saved desktop_stamp.png")

        # Verify volume initialization
        music_vol = page.evaluate("""
            window.game.scene.scenes.find(s => s.scene.key === 'MusicScene').musicVolume;
        """)
        print(f"Initialized Music Volume: {music_vol}")
        if str(music_vol) != "0.2":
            print("ERROR: Volume did not initialize correctly from localStorage!")
            sys.exit(1)

        browser.close()

        # ---- 2. Test Mobile View ----
        print("Testing Mobile View...")
        mobile_browser = p.chromium.launch(headless=True)
        mobile_context = mobile_browser.new_context()
        mobile_page = mobile_context.new_page()

        mobile_page.goto("http://localhost:8080/m/")
        mobile_page.evaluate("""
            window.localStorage.setItem('musicVolume', '0.3');
            window.localStorage.setItem('ambientVolume', '0.3');
            window.localStorage.setItem('sfxVolume', '0.3');
        """)
        mobile_page.reload()

        mobile_page.wait_for_selector("canvas", timeout=10000)
        time.sleep(2)

        mobile_page.mouse.click(200, 400)
        time.sleep(2)
        mobile_page.mouse.click(200, 400)
        time.sleep(2)

        mobile_page.evaluate("""
            const mapSceneM = window.game.scene.scenes.find(s => s.scene.key === 'MapScene');
            if (mapSceneM) {
                const eggDataArray = mapSceneM.registry.get('eggData');
                if (eggDataArray) {
                    const gpEggs = eggDataArray.filter(e => e.section === 'grand-prismatic');
                    const formattedGpEggs = gpEggs.map(e => ({ eggId: e.eggId }));
                    window.game.scene.scenes[0].registry.set('foundEggs', formattedGpEggs);
                    mapSceneM.scene.restart();
                }
            }
        """)

        time.sleep(3)
        mobile_page.screenshot(path="verification/mobile_stamp.png")
        print("Saved mobile_stamp.png")

        mobile_music_vol = mobile_page.evaluate("""
            window.game.scene.scenes.find(s => s.scene.key === 'MusicScene').musicVolume;
        """)
        print(f"Initialized Mobile Music Volume: {mobile_music_vol}")
        if str(mobile_music_vol) != "0.3":
            print("ERROR: Mobile volume did not initialize correctly from localStorage!")
            sys.exit(1)

        mobile_browser.close()
        print("Verification Successful!")

if __name__ == '__main__':
    verify_stamp()
