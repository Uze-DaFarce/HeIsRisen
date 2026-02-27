
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
  console.log('Waiting for MainMenu...');
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene && scene.tapToStartText && scene.tapToStartText.visible;
  }, { timeout: 15000 });
  console.log('Main Menu loaded. Tap to Start visible.');

  // Wait a beat for video frame
  await page.waitForTimeout(1000);

  // Click to start intro
  console.log('Clicking to start intro...');
  await page.mouse.click(640, 360);

  // Verify click registered (Text should hide)
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene.tapToStartText && !scene.tapToStartText.visible;
  }, { timeout: 2000 }).catch(() => console.log("Warning: Tap text didn't hide immediately?"));

  // Wait for Play button to appear (logic: introState = 'ready')
  console.log('Waiting for Play button (max 10s)...');
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene.startBtnContainer && scene.startBtnContainer.visible && scene.startBtnContainer.scaleX > 0.5;
  }, { timeout: 10000 });
  console.log('Play Button Visible.');

  // Click "Play Now" (center bottom area)
  // Height * 0.8 = 720 * 0.8 = 576. Center X = 640.
  // The container is at (width/2, height*0.8).
  // Let's click exactly there.
  await page.mouse.click(640, 576);
  console.log('Clicked Play Now...');

  // Wait for MapScene
  console.log('Waiting for MapScene...');
  await page.waitForFunction(() => {
      return window.game.scene.isActive('MapScene');
  }, { timeout: 10000 });

  console.log('MapScene active.');

  // Wait for Score Text to ensure render
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MapScene');
      return scene.scoreText && scene.scoreText.visible;
  }, { timeout: 5000 });

  // Enter a Level (Mammoth) by clicking a Zone
  // Use evaluate to find the zone position dynamically
  const zonePoint = await page.evaluate(() => {
      const scene = window.game.scene.getScene('MapScene');
      // "mammoth-hot-springs"
      const zone = scene.mapZones.find(z => z.name === 'mammoth-hot-springs');
      if (zone) {
          // Zone is a Game Object.
          // It has x, y, width, height (scaled/positioned in updateLayout)
          // We want the center of the zone in screen coordinates
          // Since we are in valid MapScene, we can assume x/y are world/screen coords (camera 0,0)
          return { x: zone.x + zone.width/2, y: zone.y + zone.height/2 };
      }
      return null;
  });

  if (zonePoint) {
      console.log(`Clicking Mammoth zone at ${zonePoint.x}, ${zonePoint.y}`);
      await page.mouse.click(zonePoint.x, zonePoint.y);
  } else {
      console.error("Could not find Mammoth zone!");
      await page.screenshot({ path: 'verification/error_no_zone.png' });
      await browser.close();
      return;
  }

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
  console.log('SectionHunt active and eggs loaded.');

  // Move mouse to center
  await page.mouse.move(640, 360);
  await page.waitForTimeout(2000); // Allow video/assets to settle

  // Screenshot SectionHunt
  await page.screenshot({ path: 'verification/section_hunt_baseline.png' });
  console.log('Captured section_hunt_baseline.png');

  await browser.close();
})();
