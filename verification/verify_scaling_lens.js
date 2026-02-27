
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process' // Mitigate potential cross-origin issues
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
  // We'll give it 10s to load.
  await page.waitForTimeout(10000);
  console.log('Main Menu loaded.');
  await page.screenshot({ path: 'verification/debug_loading.png' });

  // Click to start intro (Center)
  await page.mouse.click(640, 360);
  console.log('Clicked start...');

  // Wait for Intro Video to start playing (introState = 'playing')
  await page.waitForTimeout(1000);

  // Fast forward intro: We can cheat by setting the video time or just waiting
  // Or simpler: Manually trigger the "Play Now" button appearance logic if possible,
  // but let's just wait a bit and click the Play button area (bottom center)
  // The intro logic shows button after 3s.
  console.log('Waiting for Play button...');
  await page.waitForTimeout(3500);

  // Click "Play Now" (approx 640, 576 based on height * 0.8)
  await page.mouse.click(640, 580);
  console.log('Clicked Play Now...');

  // Wait for MapScene
  await page.waitForTimeout(2000);
  console.log('MapScene active.');

  // Take Screenshot of Map (Verify Fit)
  await page.screenshot({ path: 'verification/map_scene_fit.png' });
  console.log('Captured map_scene_fit.png');

  // Enter a Level (e.g., Mammoth Hot Springs)
  // We need to know where the zone is.
  // Mammoth is at approx x: 427, y: 29 in original 1280x720.
  // With "Fit" scale, these coords should be valid relative to the centered map.
  // Let's get the zone from the game state to be sure.

  const zoneCenter = await page.evaluate(() => {
      const scene = window.game.scene.getScene('MapScene');
      if (!scene || !scene.mapZones) return { x: 427, y: 29 };
      const zone = scene.mapZones.find(z => z.name === 'mammoth-hot-springs');
      if (!zone) return { x: 427, y: 29 };
      // Calculate world position
      return { x: zone.x + zone.width/2, y: zone.y + zone.height/2 };
  });

  console.log(`Clicking Mammoth zone at ${zoneCenter.x}, ${zoneCenter.y}`);
  await page.mouse.click(zoneCenter.x, zoneCenter.y);

  // Wait for SectionHunt
  await page.waitForTimeout(2000);
  console.log('SectionHunt active.');

  // Move mouse to center to test Lens
  await page.mouse.move(640, 360);
  await page.waitForTimeout(500);

  // Take Screenshot of SectionHunt (Verify Lens & Video/Image Fit)
  await page.screenshot({ path: 'verification/section_hunt_lens.png' });
  console.log('Captured section_hunt_lens.png');

  // Test Fallback: Navigate back and try a missing level (e.g. History if we deleted it, but let's simulate by forcing a scene start with bad name)
  await page.evaluate(() => {
     window.game.scene.start('SectionHunt', { sectionName: 'non-existent-level' });
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/section_hunt_fallback.png' });
  console.log('Captured section_hunt_fallback.png');

  await browser.close();
})();
