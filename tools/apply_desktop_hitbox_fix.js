const fs = require('fs');

let desktopCode = fs.readFileSync('main.js', 'utf8');

// I need to properly apply the desktop hitboxes fix for EggZamRoom
// Let's use standard replace strings.

let oldDesktopRoom = `    const examiner = this.add.image(0, 0, 'egg-zamminer').setOrigin(0, 0).setDepth(2);
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

let newDesktopRoom = `    const isDesktop = this.sys.game.device.os.desktop;
    const uiScale = Math.min(scaleX, scaleY);
    const assetScale = isDesktop ? uiScale : uiScale * 1.75;

    const offsetX = (width - 1280 * uiScale) / 2;
    const offsetY = (height - 720 * uiScale) / 2;

    // We maintain offsetX/Y for map context, but machine positioning needs to be relative to screen center
    const tanBoxCenterX = width / 2;
    const examinerWidth = 400 * assetScale;
    const examinerHeight = 500 * assetScale;
    const examinerX = tanBoxCenterX - (examinerWidth / 2);
    // Align with ground in original image relative to offset
    const floorY = offsetY + (740 * uiScale);
    const examinerY = floorY - examinerHeight;

    const examiner = this.add.image(examinerX, examinerY, 'egg-zamminer')
      .setOrigin(0, 0)
      .setDepth(2)
      .setDisplaySize(examinerWidth, examinerHeight);

    this.examiner = examiner; // Store for relative positioning`;

if (desktopCode.includes(oldDesktopRoom)) {
    desktopCode = desktopCode.replace(oldDesktopRoom, newDesktopRoom);
} else {
    console.log("Desktop examiner block not found");
}

let oldZones = `    // Zones need to be positioned relative to the SCALED examiner/room
    // Original: 450, 300, 100x200
    const leftBottleZone = this.add.zone(offsetX + 450 * uiScale, offsetY + 300 * uiScale, 100 * uiScale, 200 * uiScale).setOrigin(0, 0).setInteractive();
    // Original: 750, 300, 100x200
    const rightBottleZone = this.add.zone(offsetX + 750 * uiScale, offsetY + 300 * uiScale, 100 * uiScale, 200 * uiScale).setOrigin(0, 0).setInteractive();

    const addZoneHover = (zone) => {
        zone.on('pointerover', () => {
            this.hoverGraphics.clear();
            this.hoverGraphics.lineStyle(4, 0xffff00, 1);
            this.hoverGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
            this.hoverGraphics.fillStyle(0xffff00, 0.2);
            this.hoverGraphics.fillRect(zone.x, zone.y, zone.width, zone.height);
        });

        zone.on('pointerout', () => {
            this.hoverGraphics.clear();
        });
    };

    addZoneHover(leftBottleZone);
    addZoneHover(rightBottleZone);`;

let newZones = `    // Hitboxes aligned to visual scale of machine
    const zoneWidth = 200 * assetScale;
    const zoneHeight = 400 * assetScale;
    const zoneY = examinerY + 100 * assetScale;

    const leftBottleZone = this.add.zone(examinerX, zoneY, zoneWidth, zoneHeight)
      .setOrigin(0, 0)
      .setInteractive();

    const rightBottleZone = this.add.zone(examinerX + zoneWidth, zoneY, zoneWidth, zoneHeight)
      .setOrigin(0, 0)
      .setInteractive();

    const addZoneHover = (zone) => {
        zone.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            this.hoverGraphics.clear();
            this.hoverGraphics.lineStyle(4, 0xffff00, 1);
            this.hoverGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
            this.hoverGraphics.fillStyle(0xffff00, 0.2);
            this.hoverGraphics.fillRect(zone.x, zone.y, zone.width, zone.height);
        });

        zone.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            this.hoverGraphics.clear();
        });
    };

    addZoneHover(leftBottleZone);
    addZoneHover(rightBottleZone);

    addTooltip(this, leftBottleZone, 'Christian');
    addTooltip(this, rightBottleZone, 'Worldly / Pagan');`;

if (desktopCode.includes(oldZones)) {
    desktopCode = desktopCode.replace(oldZones, newZones);
} else {
    console.log("Desktop zones block not found");
}

let oldDisplayRandom = `  displayRandomEggInfo(offsetX, offsetY, scale) {`;
let newDisplayRandom = `  displayRandomEggInfo() {`;
desktopCode = desktopCode.replace(oldDisplayRandom, newDisplayRandom);

let oldDisplayCall1 = `this.displayRandomEggInfo(offsetX, offsetY, uiScale);`;
let oldDisplayCall2 = `this.displayRandomEggInfo(offsetX, offsetY, uiScale);`;

desktopCode = desktopCode.replace(oldDisplayCall1, `this.displayRandomEggInfo();`);
desktopCode = desktopCode.replace(oldDisplayCall2, `this.displayRandomEggInfo();`);


let eggDrawStart = desktopCode.indexOf("    if (this.currentEgg) {");
// Ensure we are inside EggZamRoom
let eggRoomClass = desktopCode.indexOf("class EggZamRoom extends Phaser.Scene {");
let actualStart = desktopCode.indexOf("    if (this.currentEgg) {", eggRoomClass);
let actualEnd = desktopCode.indexOf("  update() {", actualStart);

let newEggDraw = `    if (this.currentEgg) {
      const { eggId, symbolData } = this.currentEgg;
      const isDesktop = this.sys.game.device.os.desktop;
      const width = this.scale.width;
      const height = this.scale.height;
      const scaleX = width / 1280;
      const scaleY = height / 720;
      const scale = Math.min(scaleX, scaleY);
      const assetScale = isDesktop ? scale : scale * 2;

      const windowCenterX = 196 * assetScale;
      const windowBottomY = 190 * assetScale;
      const eggHeight = 125 * assetScale;
      const symbolHeight = 125 * assetScale;

      const eggPosX = this.examiner.x + windowCenterX;
      const eggPosY = this.examiner.y + windowBottomY - (eggHeight / 2);
      const symbolPosX = this.examiner.x + windowCenterX;
      const symbolPosY = this.examiner.y + windowBottomY - (symbolHeight / 2);

      if (this.textures.exists(\`egg-\${eggId}\`)) {
        this.displayedEggImage = this.add.image(eggPosX, eggPosY, \`egg-\${eggId}\`)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(100 * assetScale, 125 * assetScale)
          .setDepth(3);
      }
      if (symbolData && symbolData.filename && this.textures.exists(symbolData.filename)) {
        this.displayedSymbolImage = this.add.image(symbolPosX, symbolPosY, symbolData.filename)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(100 * assetScale, 125 * assetScale)
          .setDepth(3);
      }
    }
  }

`;

if (actualStart !== -1 && actualEnd !== -1) {
    let oldEggDraw = desktopCode.substring(actualStart, actualEnd);
    desktopCode = desktopCode.replace(oldEggDraw, newEggDraw);
}

fs.writeFileSync('main.js', desktopCode);
