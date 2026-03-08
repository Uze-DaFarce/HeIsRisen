const fs = require('fs');
let desktopCode = fs.readFileSync('main.js', 'utf8');

// --- EggZamRoom Hitboxes & Layout (Desktop) ---
let fix1 = desktopCode.indexOf("    const examiner = this.add.image(0, 0, 'egg-zamminer').setOrigin(0, 0).setDepth(2);");
let fixEnd = desktopCode.indexOf("    this.examiner = examiner; // Store for relative positioning");

if (fix1 !== -1 && fixEnd !== -1) {
    let replaceBlock = `
    const isDesktop = this.sys.game.device.os.desktop;
    const assetScale = isDesktop ? uiScale : uiScale * 1.75;

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
`;
    let sub = desktopCode.substring(fix1, fixEnd);
    desktopCode = desktopCode.replace(sub, replaceBlock);

    // Fix Zones
    let zoneStart = desktopCode.indexOf("    // Zones need to be positioned relative to the SCALED examiner/room");
    let zoneEnd = desktopCode.indexOf("    const showExplanation = (isCorrect, guessText) => {");

    let newZones = `    const zoneWidth = 200 * assetScale;
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
    addZoneHover(rightBottleZone);

    addTooltip(this, leftBottleZone, 'Christian');
    addTooltip(this, rightBottleZone, 'Worldly / Pagan');

`;
    if (zoneStart !== -1 && zoneEnd !== -1) {
        let subZone = desktopCode.substring(zoneStart, zoneEnd);
        desktopCode = desktopCode.replace(subZone, newZones);
    }

    // Fix displayRandomEggInfo parameter signature since we removed offsetX/Y dependency
    desktopCode = desktopCode.replace("  displayRandomEggInfo(offsetX, offsetY, scale) {", "  displayRandomEggInfo() {");
    desktopCode = desktopCode.replace("this.displayRandomEggInfo(offsetX, offsetY, uiScale);", "this.displayRandomEggInfo();");
    desktopCode = desktopCode.replace("this.displayRandomEggInfo(offsetX, offsetY, uiScale);", "this.displayRandomEggInfo();");

    // Fix egg rendering
    let eggDrawStart = desktopCode.indexOf("    if (this.currentEgg) {");
    let eggDrawEnd = desktopCode.indexOf("  update() {");
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
    if (eggDrawStart !== -1 && eggDrawEnd !== -1) {
        let subEgg = desktopCode.substring(eggDrawStart, eggDrawEnd);
        desktopCode = desktopCode.replace(subEgg, newEggDraw);
    }
}
fs.writeFileSync('main.js', desktopCode);
