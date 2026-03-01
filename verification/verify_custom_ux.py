from playwright.sync_api import sync_playwright
import time
import os
import sys

def run_verification(screenshot_name="custom_ux_check.png"):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use standard desktop resolution
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        url = "http://127.0.0.1:8080"
        try:
            page.goto(url)
            page.wait_for_load_state('networkidle')
        except Exception as e:
            print(f"Error loading page: {e}")
            return

        print("Page loaded.")

        page.mouse.click(640, 360)
        time.sleep(1)

        time.sleep(3.5)
        page.mouse.click(640, 580)
        time.sleep(2)

        print("Injecting registry data for SectionHunt...")
        page.evaluate("""() => {
            window.game.registry.set('foundEggs', []);
            if (!window.game.registry.get('sections')) {
                 window.game.registry.set('sections', [
                    { name: 'mammoth-hot-springs', eggs: [1] }
                ]);
            } else {
                 const sections = window.game.registry.get('sections');
                 const sec = sections.find(s => s.name === 'mammoth-hot-springs');
                 if (sec) { sec.eggs = [1]; }
                 else { sections.push({ name: 'mammoth-hot-springs', eggs: [1] }); }
                 window.game.registry.set('sections', sections);
            }
            window.game.registry.set('symbols', { symbols: [] });

            // Clear out any other eggs so we only have one to find
            const eggData = window.game.registry.get('eggData');
            if (eggData) {
               window.game.registry.set('eggData', [{
                   eggId: 1, section: 'mammoth-hot-springs', x: 640, y: 360, collected: false
               }]);
            }
        }""")

        page.evaluate("window.game.scene.keys['MapScene'].scene.start('SectionHunt', { sectionName: 'mammoth-hot-springs' })")
        time.sleep(2)

        # Force the idle hint timer to almost trigger to verify it skips if AFK
        print("Testing AFK Idle Hint Skip...")
        page.evaluate("""() => {
             const scene = window.game.scene.getScene('SectionHunt');
             if (scene && scene.hintTimer) {
                  // Simulate AFK > 60 seconds
                  scene.lastInteractionTime = scene.time.now - 65000;
                  // Trigger idle hint manually
                  scene.showIdleHint();
             }
        }""")
        time.sleep(1)

        # Verify no hint text exists
        has_hint = page.evaluate("""() => {
             const scene = window.game.scene.getScene('SectionHunt');
             return scene.children.list.some(c => c.type === 'Text' && c.text.includes('Hint:'));
        }""")
        print(f"Has hint text when AFK: {has_hint}")
        if has_hint:
             print("FAILURE: Hint text appeared when user was AFK.")
        else:
             print("SUCCESS: Hint text correctly did not appear when AFK.")

        # Find the single egg and collect it
        print("Finding single egg to trigger level complete...")
        egg_info = page.evaluate("""() => {
             const scene = window.game.scene.getScene('SectionHunt');
             if (!scene || !scene.eggs) return null;
             const egg = scene.eggs.getChildren().find(e => e.active);
             if (egg) return { x: egg.x, y: egg.y, id: egg.getData('eggId') };
             return null;
        }""")

        if egg_info:
             targetX = egg_info['x']
             targetY = egg_info['y']

             # Need to ensure we're interacting so mouse moved
             page.mouse.move(targetX, targetY)
             time.sleep(0.5)
             page.mouse.click(targetX, targetY)
             time.sleep(1.5)

             # Check for "level cleared" message
             has_cleared_text = page.evaluate("""() => {
                 const scene = window.game.scene.getScene('SectionHunt');
                 return scene.children.list.some(c => c.type === 'Text' && c.text.includes('Great Job Detective!!'));
             }""")

             if has_cleared_text:
                  print("SUCCESS: Level cleared text appeared correctly.")
             else:
                  print("FAILURE: Level cleared text did not appear.")

             output_path = os.path.join('verification', screenshot_name)
             page.screenshot(path=output_path)
             print(f"Screenshot saved to {output_path}")
        else:
             print("WARNING: No active eggs found to test collection.")


        browser.close()

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "custom_ux_check.png"
    run_verification(name)
