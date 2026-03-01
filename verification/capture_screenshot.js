
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    console.log('Navigating to game...');
    await page.goto('http://127.0.0.1:8080/index.html');
    await page.waitForSelector('canvas');
    await page.waitForFunction(() => window.game && window.game.isBooted);

    // --- TEST 1: MapScene Button Check ---
    console.log('Starting MapScene verification...');

    // Force start MapScene
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('MainMenu');
        if (scene) {
            scene.scene.start('MapScene');
        }
    });

    await page.waitForFunction(() => {
        const scene = window.game.scene.getScene('MapScene');
        return scene && scene.scene.isActive();
    }, { timeout: 10000 });

    await page.waitForTimeout(1000);

    // Take screenshot of fixed MapScene
    await page.screenshot({ path: 'verification/map_scene_button_fixed.png' });
    console.log('Captured verification/map_scene_button_fixed.png');

    await browser.close();
})();
