import os
from playwright.sync_api import sync_playwright
import time

def verify_settings():
    print("Starting settings panel verification...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Desktop resolution
        width = 1280
        height = 720
        context = browser.new_context(viewport={'width': width, 'height': height})
        page = context.new_page()
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PageError: {exc}"))

        try:
            print("Navigating to http://127.0.0.1:8080/index.html")
            page.goto("http://127.0.0.1:8080/index.html")

            # Wait for game to load
            print("Waiting for canvas...")
            page.wait_for_selector("canvas", state="visible", timeout=10000)
            time.sleep(5) # Allow scenes to init

            # 1. Click Gear Icon to open settings
            print("Attempting to open settings...")
            settings_visible = page.evaluate("""() => {
                const game = window.game;
                if (!game) return 'No Game Global';

                const uiScene = game.scene.getScene('UIScene');
                if (!uiScene) return 'No UIScene';

                // Simulate click on gear icon
                uiScene.openSettings();
                return uiScene.settingsContainer.visible;
            }""")

            if settings_visible is not True:
                raise Exception(f"Settings panel did not open! State: {settings_visible}")
            print("Settings panel opened successfully.")

            time.sleep(1)

            # 2. Verify Close Button exists
            print("Verifying close button...")
            close_btn_check = page.evaluate("""() => {
                const game = window.game;
                const uiScene = game.scene.getScene('UIScene');
                const container = uiScene.settingsContainer;

                const closeBtn = container.list.find(c => c.type === 'Container');

                if (!closeBtn) return { found: false };

                // Verify it has Graphics child
                const hasGraphics = closeBtn.list && closeBtn.list.some(c => c.type === 'Graphics');

                return { found: true, isContainer: true, hasGraphics: hasGraphics };
            }""")

            if not close_btn_check['found']:
                 raise Exception("Close button Container not found in settingsContainer!")
            if not close_btn_check['hasGraphics']:
                 raise Exception("Close button Container does not contain Graphics!")
            print("Close button verified (Container + Graphics).")

            # 3. Test ESC Key
            print("Testing ESC key...")
            page.keyboard.press("Escape")
            time.sleep(1)

            settings_visible_after = page.evaluate("""() => {
                const game = window.game;
                const uiScene = game.scene.getScene('UIScene');
                return uiScene.settingsContainer.visible;
            }""")

            if settings_visible_after is True:
                raise Exception("Settings panel did not close after pressing ESC!")
            print("Settings panel closed successfully via ESC.")

            print("Verification PASSED!")

        except Exception as e:
            print(f"Verification FAILED: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_settings()
