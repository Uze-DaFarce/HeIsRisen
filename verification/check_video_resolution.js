
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Try loading mammoth video
  try {
      await page.goto('http://127.0.0.1:8080/assets/video/mammoth-hot-springs.mp4');
      const dimensions = await page.evaluate(() => {
        const video = document.querySelector('video');
        return video ? { width: video.videoWidth, height: video.videoHeight } : { width: 0, height: 0 };
      });
      console.log(`Mammoth Video Resolution: ${dimensions.width}x${dimensions.height}`);
  } catch (e) {
      console.log('Failed to load Mammoth video:', e.message);
  }

  // Try loading intro video
  try {
      await page.goto('http://127.0.0.1:8080/assets/video/HeIsRisen-Intro.mp4');
      const introDimensions = await page.evaluate(() => {
          const video = document.querySelector('video');
          return video ? { width: video.videoWidth, height: video.videoHeight } : { width: 0, height: 0 };
      });
      console.log(`Intro Video Resolution: ${introDimensions.width}x${introDimensions.height}`);
  } catch (e) {
      console.log('Failed to load Intro video:', e.message);
  }

  await browser.close();
})();
