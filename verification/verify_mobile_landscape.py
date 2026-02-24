
import os
import time
from playwright.sync_api import sync_playwright

def verify_mobile_landscape():
    print("Starting Mobile Landscape verification (Grand Prismatic)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # iPhone 12 Pro dimensions: 390x844 -> 844x390 (Landscape)
        context = browser.new_context(
            viewport={'width': 844, 'height': 390},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        try:
            # We'll need to serve the files. Assuming server is running on 8080.
            page.goto("http://127.0.0.1:8080/m/index.html")
            page.wait_for_selector("canvas", state="visible", timeout=20000)
            time.sleep(2)

            # Start the specific scene with mocked data
            page.evaluate("""() => {
                const game = window.game;
                if (!game) return;

                const symbols = game.cache.json.get('symbols');
                // Create minimal map sections structure
                const mapSections = [{ name: 'grand-prismatic', eggs: [] }];

                if (symbols) {
                    game.registry.set('symbols', symbols);
                    game.registry.set('sections', mapSections);

                    // Create eggData with known positions
                    // We'll place 5 eggs in a grid or line
                    // Given 844x390 viewport, let's place them well within bounds
                    const eggData = [
                        { eggId: 1, section: 'grand-prismatic', x: 200, y: 100, symbol: null, collected: false },
                        { eggId: 2, section: 'grand-prismatic', x: 400, y: 100, symbol: null, collected: false },
                        { eggId: 3, section: 'grand-prismatic', x: 600, y: 100, symbol: null, collected: false },
                        { eggId: 4, section: 'grand-prismatic', x: 300, y: 250, symbol: null, collected: false },
                        { eggId: 5, section: 'grand-prismatic', x: 500, y: 250, symbol: null, collected: false }
                    ];

                    game.registry.set('eggData', eggData);
                    game.registry.set('foundEggs', []);
                    game.registry.set('currentScore', 0);
                    game.registry.set('highScore', 0);

                    // Set section eggs for logic
                    mapSections[0].eggs = [1, 2, 3, 4, 5];

                    // Start scene
                    game.scene.start('SectionHunt', { sectionName: 'grand-prismatic' });
                } else {
                    console.error("Cache not ready (symbols)");
                }
            }""")

            time.sleep(5) # Allow video/scene to load

            # Verify Scene and Video Background
            scene_state = page.evaluate("""() => {
                const scene = window.game.scene.getScene('SectionHunt');
                if (!scene) return { error: "No Scene" };

                const bg = scene.sectionImage;
                return {
                    bgType: bg ? bg.type : 'none',
                    bgKey: bg ? bg.texture.key : 'none',
                    width: bg ? bg.displayWidth : 0,
                    height: bg ? bg.displayHeight : 0,
                    videoPlaying: bg && bg.type === 'Video' ? bg.isPlaying() : false
                };
            }""")
            print(f"Scene State: {scene_state}")

            # Simulate finding eggs at known locations
            # We use targeted clicks to ensure reliability of the test,
            # verifying that if a user clicks on an egg, it is collected (no offset issues).
            print("Collecting eggs at known locations...")
            targets = [
                (200, 100), # Egg 1
                (400, 100), # Egg 2
                (600, 100), # Egg 3
                (300, 250), # Egg 4
                (500, 250)  # Egg 5
            ]

            for (tx, ty) in targets:
                page.mouse.click(tx, ty)
                time.sleep(0.2) # Short delay between clicks

            time.sleep(2) # Wait for animations

            # Check collected eggs
            results = page.evaluate("""() => {
                const found = window.game.registry.get('foundEggs');
                return {
                    count: found.length,
                    ids: found.map(e => e.eggId)
                };
            }""")

            print(f"Collected Eggs: {results['count']}/5")
            print(f"IDs: {results['ids']}")

            if results['count'] == 5:
                print("SUCCESS: All eggs collected!")
            else:
                print(f"FAILURE: Only collected {results['count']} eggs.")

        except Exception as e:
            print(f"Test Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_mobile_landscape()
