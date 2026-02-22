
import os
import time
from playwright.sync_api import sync_playwright

def verify_mammoth():
    print("Starting Mammoth Hot Springs verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport
        context = browser.new_context(
            viewport={'width': 812, 'height': 375},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        try:
            # We need to load the real game and navigate to Mammoth Hot Springs
            # Or inject specific logic to start there.
            page.goto("http://localhost:8080/m/index.html")
            page.wait_for_selector("canvas", state="visible", timeout=10000)
            time.sleep(2)

            # We'll use the game's actual data but force start the specific scene
            page.evaluate("""() => {
                const game = window.game;
                if (!game) return;

                // Initialize registry if needed (normally done in MainMenu)
                // We'll let MainMenu run its course briefly or manually trigger
                // But better to just start the scene if we can ensure data is loaded.

                // Let's assume MainMenu preload has finished or we wait for it.
                // To be safe, we'll manually set the minimal registry data required for SectionHunt
                // using the real data from cache if possible.

                const symbols = game.cache.json.get('symbols');
                const mapSections = game.cache.json.get('map_sections');

                if (symbols && mapSections) {
                    game.registry.set('symbols', symbols);

                    // Setup sections and eggs
                    const eggs = Array.from({ length: 60 }, (_, i) => i + 1); // 1-60
                    const sections = mapSections.map(s => ({ name: s.name, eggs: [] }));

                    // Assign some eggs to mammoth-hot-springs specifically
                    const mammoth = sections.find(s => s.name === 'mammoth-hot-springs');
                    if (mammoth) {
                        mammoth.eggs = [1, 2, 3, 4, 5]; // Assign specific eggs
                    }

                    game.registry.set('sections', sections);

                    // Create eggData
                    const eggData = [];
                    // We need to simulate the MainMenu logic for egg placement or just mock it
                    // The issue might be related to how eggs are placed or rendered on top of the jpg.
                    // So we should try to mimic the placement logic or manually place them.

                    // Let's place eggs at known visible locations
                    mammoth.eggs.forEach((eggId, i) => {
                        eggData.push({
                            eggId: eggId,
                            section: 'mammoth-hot-springs',
                            x: 100 + (i * 100), // 100, 200, 300...
                            y: 200,
                            symbol: null,
                            collected: false
                        });
                    });
                    game.registry.set('eggData', eggData);
                    game.registry.set('foundEggs', []);
                    game.registry.set('currentScore', 0);
                    game.registry.set('highScore', 0);

                    game.scene.start('SectionHunt', { sectionName: 'mammoth-hot-springs' });
                } else {
                    console.error("Cache not ready");
                }
            }""")

            time.sleep(3) # Wait for scene to load

            # Check if eggs are created and visible
            scene_info = page.evaluate("""() => {
                const scene = window.game.scene.getScene('SectionHunt');
                if (!scene) return { error: "No Scene" };

                const bg = scene.sectionImage;
                const eggs = scene.eggs ? scene.eggs.getChildren() : [];

                return {
                    bgType: bg ? bg.type : 'none',
                    bgTexture: bg ? bg.texture.key : 'none',
                    bgDepth: bg ? bg.depth : -999,
                    eggCount: eggs.length,
                    eggs: eggs.map(e => ({
                        id: e.getData('eggId'),
                        x: e.x,
                        y: e.y,
                        visible: e.visible,
                        alpha: e.alpha,
                        depth: e.depth,
                        texture: e.texture.key
                    }))
                };
            }""")

            print("Scene Info:", scene_info)

            if scene_info.get('eggCount', 0) == 0:
                print("FAILURE: No eggs found in scene!")
            else:
                eggs = scene_info['eggs']
                visible_eggs = [e for e in eggs if e['visible']] # Alpha might be 0 until magnifying glass is over
                # In this game, eggs have alpha 0 until revealed by glass.
                # But they should exist.

                print(f"Found {len(eggs)} eggs.")

                # Check depths
                bg_depth = scene_info['bgDepth']
                for e in eggs:
                    if e['depth'] <= bg_depth:
                        print(f"FAILURE: Egg {e['id']} depth ({e['depth']}) is <= BG depth ({bg_depth})!")
                    else:
                        print(f"SUCCESS: Egg {e['id']} is above background.")

        except Exception as e:
            print(f"Script Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_mammoth()
