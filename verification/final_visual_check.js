
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
  await page.goto('http://127.0.0.1:8080/index.html');

  // Wait for MainMenu
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene && scene.tapToStartText && scene.tapToStartText.visible;
  }, { timeout: 15000 });

  // Start Intro
  await page.mouse.click(640, 360);

  // Wait for Play button
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('MainMenu');
      return scene.startBtnContainer && scene.startBtnContainer.visible && scene.startBtnContainer.scaleX > 0.5;
  }, { timeout: 10000 });

  // Click "Play Now"
  await page.evaluate(() => {
      const scene = window.game.scene.getScene('MainMenu');
      if (scene.startBtnContainer.visible) {
          scene.startBtnContainer.emit('pointerdown');
      }
  });

  // Wait for MapScene
  await page.waitForFunction(() => window.game.scene.isActive('MapScene'), { timeout: 15000 });

  // Find Mammoth Zone
  const zonePoint = await page.evaluate(() => {
      const scene = window.game.scene.getScene('MapScene');
      const zone = scene.mapZones.find(z => z.name === 'mammoth-hot-springs');
      return zone ? { x: zone.x + zone.width/2, y: zone.y + zone.height/2 } : null;
  });

  if (!zonePoint) throw new Error("Zone not found");

  // Click Zone
  await page.waitForTimeout(1000);
  await page.mouse.click(zonePoint.x, zonePoint.y);

  // Wait for SectionHunt
  await page.waitForFunction(() => window.game.scene.isActive('SectionHunt'), { timeout: 10000 });

  // Wait for Eggs
  await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('SectionHunt');
      return scene.eggs && scene.eggs.getLength() > 0;
  }, { timeout: 5000 });

  // Move mouse to center to show lens
  await page.mouse.move(640, 360);
  await page.waitForTimeout(2000);

  // Take Screenshot
  await page.screenshot({ path: 'verification/final_visual_verification.png' });
  console.log('Captured final_visual_verification.png');

  await browser.close();
})();
