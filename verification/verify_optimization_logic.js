
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security'
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

  // Wait for MainMenu
  console.log('Waiting for MainMenu...');
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene && scene.tapToStartText && scene.tapToStartText.visible;
  }, { timeout: 15000 });

  // Click to start intro
  await page.mouse.click(640, 360);

  // Wait for Play button
  console.log('Waiting for Play button...');
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene.startBtnContainer && scene.startBtnContainer.visible && scene.startBtnContainer.scaleX > 0.5;
  }, { timeout: 10000 });

  // Click "Play Now"
  // Retry click logic or verify it happened
  const clicked = await page.evaluate(() => {
      const scene = window.game.scene.getScene('MainMenu');
      if (scene.startBtnContainer.visible) {
          // Dispatch pointerdown event manually to ensure it hits
          scene.startBtnContainer.emit('pointerdown');
          return true;
      }
      return false;
  });
  console.log(`Clicked Play Now (Direct Event): ${clicked}`);

  // Wait for MapScene
  await page.waitForFunction(() => window.game.scene.isActive('MapScene'), { timeout: 15000 });
  console.log('MapScene active.');

  // Find Mammoth Zone
  const zonePoint = await page.evaluate(() => {
      const scene = window.game.scene.getScene('MapScene');
      const zone = scene.mapZones.find(z => z.name === 'mammoth-hot-springs');
      return zone ? { x: zone.x + zone.width/2, y: zone.y + zone.height/2 } : null;
  });

  if (!zonePoint) {
      console.error("Could not find Mammoth zone!");
      await browser.close();
      return;
  }

  // Click Zone (Wait for stable MapScene first)
  await page.waitForTimeout(1000);
  console.log(`Clicking Zone at ${zonePoint.x}, ${zonePoint.y}...`);
  await page.mouse.click(zonePoint.x, zonePoint.y);

  // Wait for SectionHunt
  await page.waitForFunction(() => window.game.scene.isActive('SectionHunt'), { timeout: 10000 });

  // Wait for Eggs
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('SectionHunt');
      return scene.eggs && scene.eggs.getLength() > 0;
  }, { timeout: 5000 });

  console.log('SectionHunt active and eggs loaded.');

  // VERIFY OPTIMIZATION
  // We spy on zoomedView.clear()
  const result = await page.evaluate(() => {
      const scene = window.game.scene.getScene('SectionHunt');

      // 1. Force state update
      scene.input.activePointer.x = 200;
      scene.input.activePointer.y = 200;
      scene.update(); // Sets lastInputX=200, lastInputY=200

      // 2. Prepare spy
      let drawCalls = 0;
      const originalClear = scene.zoomedView.clear;
      scene.zoomedView.clear = function() {
          drawCalls++;
          originalClear.apply(this, arguments);
      };

      // 3. Call update with SAME input (200, 200)
      scene.update();

      // 4. Restore
      scene.zoomedView.clear = originalClear;

      return {
          drawCalls: drawCalls,
          isUsingVideo: scene.isUsingVideo,
          lastX: scene.lastInputX
      };
  });

  console.log('Optimization Test Result:', result);

  if (result.isUsingVideo) {
      console.log("Note: Scene using video background, optimization inactive (correct behavior).");
  } else if (result.drawCalls === 0) {
      console.log("SUCCESS: Static input skipped redundant draw calls!");
  } else {
      console.error(`FAILURE: Static input triggered ${result.drawCalls} draw calls.`);
  }

  await browser.close();
})();
