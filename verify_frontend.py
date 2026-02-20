
import os
from playwright.sync_api import sync_playwright
import time

def verify_frontend():
    print("Starting frontend verification...")
    screenshot_path = "/home/jules/verification/mobile_fix_verification.png"

    with sync_playwright() as p:
        # iPhone 13 Pro Max Landscape approx 926x428
        # User reported issue on "phone".
        # Let's use a standard mobile landscape resolution.
        width = 812
        height = 375

        print(f"Viewport: {width}x{height}")

        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': width, 'height': height},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        try:
            page.goto("http://localhost:8080/m/index.html")
            page.wait_for_selector("canvas", state="visible", timeout=10000)

            # Wait for scene initialization and animations
            time.sleep(5)

            # Perform programmatic checks
            checks = page.evaluate("""() => {
                const game = window.game;
                if (!game) return { error: 'No Game Global' };
                const scene = game.scene.getScene('MainMenu');
                if (!scene) return { error: 'No MainMenu Scene' };

                let btnY = 'Not Found';
                const containers = scene.children.list.filter(c => c.type === 'Container');
                for (let c of containers) {
                    // Check for text child
                    const text = c.list.find(child => child.type === 'Text' && (child.text.includes('Tap Here') || child.text.includes('Play Now')));
                    if (text) {
                        btnY = c.y;
                        break;
                    }
                }

                let cursorDepth = 'Not Found';
                if (scene.fingerCursor) {
                    cursorDepth = scene.fingerCursor.depth;
                }

                return {
                    btnY: btnY,
                    cursorDepth: cursorDepth,
                    gameHeight: game.config.height,
                    scale: scene.gameScale
                };
            }""")

            print("Verification Results:", checks)

            # Ensure output directory exists
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)

            # Take screenshot
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Verification FAILED: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
