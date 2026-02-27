
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
  });
  const page = await context.newPage();

  console.log('Navigating to game...');
  // Use 127.0.0.1 to avoid potential localhost IPv6 issues
  await page.goto('http://127.0.0.1:8080/index.html');

  // Wait for canvas
  await page.waitForSelector('canvas');
  console.log('Canvas found.');

  // Wait for loading to finish (Tap to Start text)
  // The text is "Click anywhere to start". We can query the Phaser scene state instead of DOM.
  console.log('Waiting for MainMenu...');
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene && scene.tapToStartText && scene.tapToStartText.visible;
  }, { timeout: 15000 });
  console.log('Main Menu loaded. Taking screenshot...');

  // Wait a beat for video frame
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification/intro_fixed.png' });
  console.log('Captured intro_fixed.png');

  // Click to start intro
  await page.mouse.click(640, 360);
  console.log('Clicked start...');

  // Wait for Play button to appear (logic: introState = 'ready')
  console.log('Waiting for Play button (approx 3s)...');
  await page.waitForTimeout(4000);

  // Verify Play Button is visible in Phaser
  const btnVisible = await page.evaluate(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene.startBtnContainer.visible;
  });
  console.log(`Play Button Visible: ${btnVisible}`);

  if (!btnVisible) {
      console.error('Play button not visible! Aborting.');
      await page.screenshot({ path: 'verification/debug_no_play_btn.png' });
      await browser.close();
      return;
  }

  // Click "Play Now" (center bottom area)
  // Height * 0.8 = 720 * 0.8 = 576. Center X = 640.
  await page.mouse.click(640, 580);
  console.log('Clicked Play Now...');

  // Wait for MapScene
  console.log('Waiting for MapScene...');
  await page.waitForFunction(() => {
      return window.game.scene.isActive('MapScene');
  }, { timeout: 10000 });

  // Wait for Score Text to ensure render
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MapScene');
      return scene.scoreText && scene.scoreText.visible;
  }, { timeout: 5000 });
  console.log('MapScene active and rendered.');

  await page.waitForTimeout(500); // stable frame
  await page.screenshot({ path: 'verification/map_cover.png' });
  console.log('Captured map_cover.png');

  // Enter a Level (Mammoth)
  // Get world coords for zone
  const zoneCenter = await page.evaluate(() => {
      const scene = window.game.scene.getScene('MapScene');
      const zone = scene.mapZones.find(z => z.name === 'mammoth-hot-springs');
      if (!zone) return { x: 427, y: 29 };
      // Zone coords are scaled by scene logic, let's just get the zone object's transformed position
      // Zone x/y is top-left usually for Rectangle, but here it's origin 0,0.
      // So center is x + width/2 * scale, y + height/2 * scale?
      // Wait, zones are GameObjects. Let's use their world transform.
      // But zones don't have texture/rendering usually.
      // The updateLayout code sets position and size.
      return { x: zone.x + zone.width/2, y: zone.y + zone.height/2 };
  });

  console.log(`Clicking Mammoth zone at ${zoneCenter.x}, ${zoneCenter.y}`);
  await page.mouse.click(zoneCenter.x, zoneCenter.y);

  // Wait for SectionHunt
  console.log('Waiting for SectionHunt...');
  await page.waitForFunction(() => {
      return window.game.scene.isActive('SectionHunt');
  }, { timeout: 10000 });

  // Wait for Lens/Eggs to be ready
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('SectionHunt');
      return scene.eggs && scene.eggs.getLength() > 0;
  }, { timeout: 5000 });
  console.log('SectionHunt active.');

  // Move mouse to center
  await page.mouse.move(640, 360);
  await page.waitForTimeout(1000); // Allow video to buffer if any

  // Screenshot SectionHunt
  await page.screenshot({ path: 'verification/section_hunt_cover.png' });
  console.log('Captured section_hunt_cover.png');

  await browser.close();
})();
