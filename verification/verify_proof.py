from playwright.sync_api import sync_playwright
import time
import os

def generate_proof():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        if not os.path.exists('verification'):
            os.makedirs('verification')

        url = "http://127.0.0.1:8080"
        try:
            page.goto(url)
            page.wait_for_load_state('networkidle')
        except Exception as e:
            print(f"Error loading page: {e}")
            return

        print("Page loaded.")

        # 1. MainMenu
        page.mouse.click(640, 360) # Start interaction
        time.sleep(1)
        page.screenshot(path='verification/proof_1_mainmenu.png')
        print("Captured proof_1_mainmenu.png")

        # 2. MapScene
        time.sleep(3.5) # Wait for Play button
        page.mouse.click(640, 580) # Click Play
        time.sleep(2)
        page.screenshot(path='verification/proof_2_mapscene.png')
        print("Captured proof_2_mapscene.png")

        # Inject Data
        page.evaluate("""() => {
            window.game.registry.set('foundEggs', []);
            if (!window.game.registry.get('sections')) {
                 window.game.registry.set('sections', [
                    { name: 'mammoth-hot-springs', eggs: [1, 2, 3] },
                    { name: 'yellowstone-hydrothermal', eggs: [4, 5, 6] }
                ]);
            }
            window.game.registry.set('symbols', { symbols: [] });
        }""")

        # 3. SectionHunt - Mammoth (Video)
        page.evaluate("window.game.scene.keys['MapScene'].scene.start('SectionHunt', { sectionName: 'mammoth-hot-springs' })")
        time.sleep(3)
        page.screenshot(path='verification/proof_3_mammoth_video.png')
        print("Captured proof_3_mammoth_video.png")

        # 4. SectionHunt - Hydrothermal (Fallback)
        page.evaluate("window.game.scene.keys['MapScene'].scene.start('SectionHunt', { sectionName: 'yellowstone-hydrothermal' })")
        time.sleep(3)
        page.screenshot(path='verification/proof_4_hydro_fallback.png')
        print("Captured proof_4_hydro_fallback.png")

        browser.close()

if __name__ == "__main__":
    generate_proof()
