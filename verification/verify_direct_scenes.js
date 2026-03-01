
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

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  console.log('Navigating to game...');
  await page.goto('http://127.0.0.1:8080/index.html');
  await page.waitForSelector('canvas');

  // Jump straight to MapScene
  console.log('Force starting MapScene...');
  await page.evaluate(() => {
      window.game.scene.start('MapScene');
  });

  // Wait for MapScene
  await page.waitForFunction(() => {
      return window.game.scene.isActive('MapScene');
  }, { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verification/map_cover_direct.png' });
  console.log('Captured map_cover_direct.png');

  // Jump straight to SectionHunt (Mammoth)
  console.log('Force starting SectionHunt...');
  await page.evaluate(() => {
      window.game.scene.start('SectionHunt', { sectionName: 'mammoth-hot-springs' });
  });

  // Wait for SectionHunt
  await page.waitForFunction(() => {
      return window.game.scene.isActive('SectionHunt');
  }, { timeout: 10000 });

  // Allow time for update() loop to fix scaling
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'verification/section_hunt_cover_direct.png' });
  console.log('Captured section_hunt_cover_direct.png');

  await browser.close();
})();
