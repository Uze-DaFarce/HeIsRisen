
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true, // Set to false to see it in action if needed locally
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    // Log console output from the browser
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    console.log('Navigating to game...');
    // Ensure we go to index.html to load everything properly
    await page.goto('http://127.0.0.1:8080/index.html');
    await page.waitForSelector('canvas');

    // Wait for game to be ready (game instance available)
    await page.waitForFunction(() => window.game && window.game.isBooted);

    // --- TEST 1: MapScene Button Check ---
    console.log('Starting MapScene verification...');

    // Force start MapScene to skip Intro
    await page.evaluate(() => {
        const scene = window.game.scene.getScene('MainMenu');
        if (scene) {
            scene.scene.start('MapScene');
        } else {
            console.error('MainMenu not found, cannot start MapScene');
        }
    });

    // Wait for MapScene to be active
    await page.waitForFunction(() => {
        const scene = window.game.scene.getScene('MapScene');
        return scene && scene.scene.isActive();
    }, { timeout: 10000 });

    // Wait a bit for create() to finish and layout to settle
    await page.waitForTimeout(1000);

    // Inspect the 'eggsAmminHaul' button
    const buttonInfo = await page.evaluate(() => {
        const scene = window.game.scene.getScene('MapScene');
        const btn = scene.eggsAmminHaul;
        if (!btn) return { error: 'Button not found' };

        return {
            visible: btn.visible,
            x: btn.x,
            y: btn.y,
            displayWidth: btn.displayWidth,
            displayHeight: btn.displayHeight,
            scaleX: btn.scaleX,
            scaleY: btn.scaleY,
            depth: btn.depth,
            interactive: !!btn.input
        };
    });

    console.log('MapScene Button Info:', buttonInfo);

    // Verify Dimensions (Expected ~137x150 scaled by uiScale)
    // At 1280x720, scale should be 1. uiScale 1.
    // Current bug: it's "way too big", so displayWidth likely > 137 significantly if it's raw image size.
    // The raw image 'eggs-ammin-haul' size needs to be checked or inferred.

    if (buttonInfo.displayHeight > 200) {
        console.log('FAIL: Button seems too big (Height > 200)');
    } else {
        console.log('PASS: Button size seems reasonable (Height <= 200)');
    }

    // Try clicking it via Playwright to see if scene changes
    console.log('Attempting to click button...');

    // We simulate a click at the button's position
    await page.mouse.click(buttonInfo.x + buttonInfo.displayWidth / 2, buttonInfo.y + buttonInfo.displayHeight / 2);

    await page.waitForTimeout(1000);

    const isEggZamRoomActive = await page.evaluate(() => {
        const scene = window.game.scene.getScene('EggZamRoom');
        return scene && scene.scene.isActive();
    });

    if (isEggZamRoomActive) {
        console.log('PASS: Click worked, navigated to EggZamRoom');
        // Go back to map for next test
        await page.evaluate(() => window.game.scene.start('MapScene'));
        await page.waitForTimeout(1000);
    } else {
        console.log('FAIL: Click did NOT navigate to EggZamRoom');
    }

    // --- TEST 2: SectionHunt Audio Check ---
    console.log('Starting SectionHunt verification...');

    // Set Ambient Volume to a known value (e.g., 0.8)
    await page.evaluate(() => {
        window.game.registry.set('ambientVolume', 0.8);
    });

    // Start SectionHunt with a known video section
    await page.evaluate(() => {
        window.game.scene.start('SectionHunt', { sectionName: 'mammoth-hot-springs' });
    });

    await page.waitForFunction(() => {
        const scene = window.game.scene.getScene('SectionHunt');
        return scene && scene.scene.isActive();
    }, { timeout: 10000 });

    await page.waitForTimeout(2000); // Wait for video to load/play

    const videoInfo = await page.evaluate(() => {
        const scene = window.game.scene.getScene('SectionHunt');
        const video = scene.sectionVideo;
        if (!video) return { error: 'Video not found or falling back to image' };

        return {
            isPlaying: video.isPlaying(),
            isMuted: video.isMuted(), // Phaser 3 video object property?
            volume: video.volume, // Phaser 3 video volume
            textureKey: video.texture.key
        };
    });

    console.log('SectionHunt Video Info:', videoInfo);

    if (videoInfo.error) {
        console.log('WARN: Could not verify video (maybe fallback active?)');
    } else {
        if (videoInfo.isMuted) {
            console.log('FAIL: Video is MUTED');
        } else {
            console.log('PASS: Video is UNMUTED');
        }

        if (Math.abs(videoInfo.volume - 0.8) < 0.01) {
            console.log('PASS: Video volume matches ambient setting (0.8)');
        } else {
            console.log(`FAIL: Video volume ${videoInfo.volume} does not match ambient setting 0.8`);
        }
    }

    await browser.close();
})();
