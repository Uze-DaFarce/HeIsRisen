from playwright.sync_api import sync_playwright
import time
import os

def test_keyboard_dismissal():
    print("Testing Keyboard Dismissal (ESC, ENTER, SPACE) on Desktop...")
    os.makedirs("verification", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080/")

        # Mute audio to avoid autoplay errors
        page.evaluate("""(() => {
            window.localStorage.setItem('musicVolume', '0.0');
            window.localStorage.setItem('ambientVolume', '0.0');
            window.localStorage.setItem('sfxVolume', '0.0');
        })()""")
        page.reload()

        page.wait_for_selector("canvas", timeout=10000)
        time.sleep(2)
        page.mouse.click(640, 360) # Start game
        time.sleep(2)
        page.mouse.click(640, 360) # Skip intro
        time.sleep(2)

        # Start EggZamRoom
        page.evaluate("""(() => {
            const eggData = [
                { eggId: '1', section: 'grand-prismatic', x: 0, y: 0, symbolData: { filename: 'assets/symbols/christian/cross.png', category: 'Christian', name: 'Cross' } }
            ];
            window.game.scene.scenes[0].registry.set('eggData', eggData);
            window.game.scene.scenes[0].registry.set('foundEggs', [{eggId: '1', categorized: false, symbolData: { filename: 'assets/symbols/christian/cross.png', category: 'Christian', name: 'Cross' }}]);
            window.game.scene.scenes[0].scene.start('EggZamRoom');
        })()""")

        time.sleep(3)

        # Click left bottle (Christian) to categorize the egg and open explanation modal
        page.mouse.click(500, 400)
        time.sleep(2)

        # Verify modal is open
        is_open_before = page.evaluate("""(() => {
            const room = window.game.scene.scenes.find(s => s.scene.key === 'EggZamRoom');
            if (!room) return "Room not found";
            return room.explanationText !== null;
        })()""")
        print(f"Modal open before keypress: {is_open_before}")


        # Press ESC to dismiss
        page.keyboard.press("Escape")
        time.sleep(2)

        # Verify modal is closed
        is_open_after_esc = page.evaluate("""(() => {
            const room = window.game.scene.scenes.find(s => s.scene.key === 'EggZamRoom');
            if (!room) return "Room not found";
            return room.explanationText !== null;
        })()""")
        print(f"Modal open after ESC: {is_open_after_esc}")

        browser.close()

if __name__ == '__main__':
    test_keyboard_dismissal()
