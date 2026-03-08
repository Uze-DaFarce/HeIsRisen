const fs = require('fs');

let desktopCode = fs.readFileSync('main.js', 'utf8');

// Update desktop EggZamRoom to use the dynamic central layout from m/main.js
// Looking at main.js, EggZamRoom create():
let originalCreate = `  create() {
    this.input.setDefaultCursor('none');

    // Scale logic
    const width = this.scale.width;
    const height = this.scale.height;
    const scaleX = width / 1280;
    const scaleY = height / 720;
    const scale = Math.min(scaleX, scaleY); // Fit logic for minigame usually better, but let's try cover or contained fit
    // Background is 1280x720. Let's FIT.
    const bgScale = Math.min(scaleX, scaleY);

    // Position background centered
    this.add.image(width/2, height/2, 'egg-zam-room')
      .setDisplaySize(1280 * bgScale, 720 * bgScale)
      .setDepth(0);

    const examiner = this.add.image(0, 0, 'egg-zamminer').setOrigin(0, 0).setDepth(2);
    // Original pos: 390, 250. Size? Default.
    // Let's assume original design was 1280x720 fixed.
    // We scale everything by 'scale' (min) to ensure UI fits on screen.
    // But we need to center the "game area" in the viewport.

    const uiScale = Math.min(scaleX, scaleY);
    const offsetX = (width - 1280 * uiScale) / 2;
    const offsetY = (height - 720 * uiScale) / 2;

    // Examiner
    examiner.setPosition(offsetX + 390 * uiScale, offsetY + 250 * uiScale);
    examiner.setScale(uiScale);

    this.examiner = examiner; // Store for relative positioning`;

let newCreate = `  create() {
    this.input.setDefaultCursor('none');

    const width = this.scale.width;
    const height = this.scale.height;
    const scaleX = width / 1280;
    const scaleY = height / 720;
    this.gameScale = Math.min(scaleX, scaleY);
    const uiScale = this.gameScale;
    const scale = this.gameScale;

    this.add.image(width/2, height/2, 'egg-zam-room')
      .setDisplaySize(1280 * this.gameScale, 720 * this.gameScale)
      .setDepth(0);

    const isDesktop = this.sys.game.device.os.desktop;
    const assetScale = isDesktop ? this.gameScale : this.gameScale * 1.75;

    const tanBoxCenterX = (640 / 1280) * width;
    const examinerWidth = 400 * assetScale;
    const examinerHeight = 500 * assetScale;
    const examinerX = tanBoxCenterX - (examinerWidth / 2);
    const floorY = isDesktop ? ((740 / 720) * height) : height + (100 * assetScale);
    const examinerY = floorY - examinerHeight;

    const examiner = this.add.image(examinerX, examinerY, 'egg-zamminer')
      .setOrigin(0, 0)
      .setDepth(2)
      .setDisplaySize(examinerWidth, examinerHeight);

    this.examiner = examiner; // Store for relative positioning`;


if (desktopCode.includes(originalCreate)) {
    console.log("Found original create");
} else {
    // maybe parts are different?
    let parts = originalCreate.split('\n');
    let found = true;
    for (let p of parts) {
        if (!desktopCode.includes(p.trim())) {
             console.log("Missing part:", p.trim());
             found = false;
        }
    }
}
