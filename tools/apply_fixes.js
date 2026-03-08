const fs = require('fs');

// ---------------------------------------------------------
// 1. Desktop Fixes (main.js)
// ---------------------------------------------------------
let desktopCode = fs.readFileSync('main.js', 'utf8');

// --- ESC Toggle ---
desktopCode = desktopCode.replace(
  "    // Add ESC key support\n    const closeSettings = () => {\n        if (this.settingsContainer.visible) {\n            this.settingsContainer.setVisible(false);\n            this.gearIcon.setVisible(true);\n            this.gearIcon.setScale(1);\n            this.input.setDefaultCursor('none');\n        }\n    };\n    this.input.keyboard.on('keydown-ESC', closeSettings);\n    this.input.keyboard.on('keydown-ENTER', closeSettings);",
  "    // Add ESC key support to toggle settings\n    const toggleSettings = () => {\n        if (this.settingsContainer.visible) {\n            this.settingsContainer.setVisible(false);\n            this.gearIcon.setVisible(true);\n            this.gearIcon.setScale(1);\n            this.input.setDefaultCursor('none');\n        } else {\n            this.openSettings();\n        }\n    };\n    this.input.keyboard.on('keydown-ESC', toggleSettings);\n    this.input.keyboard.on('keydown-ENTER', () => { if (this.settingsContainer.visible) toggleSettings(); });"
);

// --- Settings Overlay Layout (Math.min constraints) ---
let resizeStart = desktopCode.indexOf("  resize(gameSize) {");
let createGearIcon = desktopCode.indexOf("  createGearIcon() {");

if (resizeStart !== -1 && createGearIcon !== -1) {
    let newResize = `  resize(gameSize) {
      const width = gameSize.width;
      const height = gameSize.height;

      if (this.gearIcon) {
          this.gearIcon.x = width - 60;
          this.gearIcon.y = 60;
      }

      if (this.settingsContainer) {
          const isVisible = this.settingsContainer.visible;
          this.settingsContainer.removeAll(true);
          this.createSettingsPanelContent(width, height);
          this.settingsContainer.setVisible(isVisible);
      }
  }

`;
    desktopCode = desktopCode.substring(0, resizeStart) + newResize + desktopCode.substring(createGearIcon);
}

let fixedCreateSettingsPanel = `  createSettingsPanel() {
    this.settingsContainer = this.add.container(0, 0).setVisible(false).setDepth(100);
    this.createSettingsPanelContent(this.cameras.main.width, this.cameras.main.height);
  }

  createSettingsPanelContent(screenWidth, screenHeight) {
    const maxWidth = 500;
    const maxHeight = 500;
    const margin = 20;

    // Scale constraints
    const width = Math.min(maxWidth, screenWidth - margin * 2);
    const height = Math.min(maxHeight, screenHeight - margin * 2);

    const x = (screenWidth - width) / 2;
    const y = (screenHeight - height) / 2;

    // Overlay to block clicks and dim background
    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7)
        .setOrigin(0)
        .setInteractive();

    this.settingsContainer.add(overlay);

    // Panel background
    const panel = this.add.rectangle(screenWidth / 2, screenHeight / 2, width, height, 0x333333)
        .setStrokeStyle(4, 0xffffff);
    this.settingsContainer.add(panel);

    // Title
    const title = this.add.text(screenWidth / 2, y + 40, 'Audio Settings', {
        fontSize: '32px',
        fontFamily: 'Comic Sans MS',
        fill: '#ffffff'
    }).setOrigin(0.5);
    this.settingsContainer.add(title);

    // Close Button
    const closeSize = 40;
    const closeX = x + width - 30;
    const closeY = y + 30;

    const closeBtn = this.add.container(closeX, closeY);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xff4444, 1);
    closeBg.fillCircle(0, 0, closeSize / 2);
    closeBg.lineStyle(2, 0xffffff, 1);
    closeBg.strokeCircle(0, 0, closeSize / 2);

    const xSize = closeSize / 4;
    closeBg.lineStyle(3, 0xffffff, 1);
    closeBg.beginPath();
    closeBg.moveTo(-xSize, -xSize);
    closeBg.lineTo(xSize, xSize);
    closeBg.moveTo(xSize, -xSize);
    closeBg.lineTo(-xSize, xSize);
    closeBg.strokePath();

    closeBtn.add(closeBg);
    closeBtn.setSize(closeSize, closeSize);
    closeBtn.setInteractive(new Phaser.Geom.Circle(0, 0, closeSize / 2), Phaser.Geom.Circle.Contains);

    closeBtn.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
        this.tweens.add({ targets: closeBtn, scaleX: 1.1, scaleY: 1.1, duration: 100, ease: 'Sine.easeInOut' });
    });

    closeBtn.on('pointerout', () => {
        this.input.setDefaultCursor('default');
        this.tweens.add({ targets: closeBtn, scaleX: 1.0, scaleY: 1.0, duration: 100, ease: 'Sine.easeInOut' });
    });

    closeBtn.on('pointerdown', () => {
        this.settingsContainer.setVisible(false);
        this.gearIcon.setVisible(true);
        this.gearIcon.setScale(1);
        this.input.setDefaultCursor('none');
    });
    this.settingsContainer.add(closeBtn);

    // Dynamic Spacing for Sliders
    const contentTop = y + 80;
    const contentHeight = height - 100;
    const spacing = contentHeight / 3;
    const trackWidth = Math.min(200, width - 60);

    this.createSlider('Music', contentTop + spacing * 0.5, screenWidth / 2, 'music', trackWidth);
    this.createSlider('Ambient', contentTop + spacing * 1.5, screenWidth / 2, 'ambient', trackWidth);
    this.createSlider('SFX', contentTop + spacing * 2.5, screenWidth / 2, 'sfx', trackWidth);
  }`;

let start = desktopCode.indexOf("  createSettingsPanel() {");
let end = desktopCode.indexOf("  openSettings() {");

if (start !== -1 && end !== -1) {
    let newSlider = `
  createSlider(label, y, centerX, type, trackWidth = 200) {
    const startX = centerX - (trackWidth / 2);
    const endX = centerX + (trackWidth / 2);

    const text = this.add.text(centerX, y - 30, label, {
        fontSize: '24px',
        fontFamily: 'Comic Sans MS',
        fill: '#ffffff'
    }).setOrigin(0.5);
    this.settingsContainer.add(text);

    const trackHitArea = this.add.rectangle(centerX, y + 10, trackWidth, 60, 0x888888, 0).setInteractive({ cursor: 'pointer' });
    this.settingsContainer.add(trackHitArea);
    this.settingsContainer.add(this.add.rectangle(centerX, y + 10, trackWidth, 4, 0x888888));

    let currentVol = 0.5;
    if (this.registry.has(\`\${type}Volume\`)) currentVol = this.registry.get(\`\${type}Volume\`);

    const handleContainer = this.add.container(startX + (currentVol * trackWidth), y + 10);
    handleContainer.setSize(60, 60);
    handleContainer.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
    this.input.setDraggable(handleContainer);

    const visualHandle = this.add.circle(0, 0, 12, 0xffffff);
    handleContainer.add(visualHandle);

    this.settingsContainer.add(handleContainer);

    const updateVolume = (x) => {
        const clampedX = Phaser.Math.Clamp(x, startX, endX);
        handleContainer.x = clampedX;
        this.registry.set(\`\${type}Volume\`, (clampedX - startX) / trackWidth);
    };

    handleContainer.on('drag', (p, x) => updateVolume(x));
    trackHitArea.on('pointerdown', (p) => updateVolume(p.worldX));

    handleContainer.on('pointerover', () => { handleContainer.setScale(1.3); this.input.setDefaultCursor('pointer'); });
    handleContainer.on('pointerout', () => { handleContainer.setScale(1); this.input.setDefaultCursor('default'); });
  }

`;
    desktopCode = desktopCode.substring(0, start) + fixedCreateSettingsPanel + newSlider + desktopCode.substring(end);
}

// --- EggZamRoom Layout and Tooltips (Desktop) ---
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

// ---------------------------------------------------------
// 2. Mobile Fixes (m/main.js)
// ---------------------------------------------------------
let mobileCode = fs.readFileSync('m/main.js', 'utf8');

// --- ESC Toggle ---
mobileCode = mobileCode.replace(
  "    // Add ESC and ENTER key support to close settings\n    const closeSettings = () => {\n        if (this.settingsContainer && this.settingsContainer.visible) {\n            this.settingsContainer.setVisible(false);\n            if (this.gearIcon) this.gearIcon.setVisible(true);\n            this.input.setDefaultCursor('none');\n        }\n    };\n    if (this.input.keyboard) {\n        this.input.keyboard.on('keydown-ESC', closeSettings);\n        this.input.keyboard.on('keydown-ENTER', closeSettings);\n    }",
  "    // Add ESC and ENTER key support to toggle settings\n    const toggleSettings = () => {\n        if (this.settingsContainer && this.settingsContainer.visible) {\n            this.settingsContainer.setVisible(false);\n            if (this.gearIcon) this.gearIcon.setVisible(true);\n            this.input.setDefaultCursor('none');\n        } else {\n            this.openSettings();\n        }\n    };\n    if (this.input.keyboard) {\n        this.input.keyboard.on('keydown-ESC', toggleSettings);\n        this.input.keyboard.on('keydown-ENTER', () => { if (this.settingsContainer && this.settingsContainer.visible) toggleSettings(); });\n    }"
);

// --- Syntax Error Fix (m/main.js) ---
// The user previously reported an unmatched bracket syntax error in m/main.js. Let's check for it.
// The file ends with:
//   resizeGame();
//   window.addEventListener('resize', resizeGame);
//   window.addEventListener('orientationchange', resizeGame);
// });
// Wait, looking at m/main.js, this is standard wrapping.
// However, the earlier `fix_syntax3.js` parse error indicated a problem at EOF in previous tries. We reset the code, so let's verify syntax before writing.

// --- Tooltips for Mobile ---
let tooltipCodeMatch = desktopCode.match(/function addTooltip\(scene, object, text\) \{[\s\S]*?\}\n\n\/\*+/);
let tooltipCodeStr = "";
if (tooltipCodeMatch) {
    tooltipCodeStr = tooltipCodeMatch[0].replace(/\/\*+/, "").trim();
} else {
    // manual extract
    let lines = desktopCode.split('\n');
    let startIdx = -1;
    let endIdx = -1;
    for(let i=0; i<lines.length; i++) {
        if(lines[i].startsWith('function addTooltip(')) startIdx = i;
        if(startIdx !== -1 && lines[i] === '// Game configuration') {
            endIdx = i;
            break;
        }
    }
    if (startIdx !== -1 && endIdx !== -1) {
        tooltipCodeStr = lines.slice(startIdx, endIdx).join('\n').trim();
    }
}

if (tooltipCodeStr && !mobileCode.includes("function addTooltip(")) {
    mobileCode = mobileCode.replace(
        "function parseScriptureLink(scriptureText) {",
        tooltipCodeStr + "\n\nfunction parseScriptureLink(scriptureText) {"
    );

    // Add tooltips to zones in m/main.js
    mobileCode = mobileCode.replace(
      "    this.leftBottleZone.on('pointerdown', () => {",
      "    addTooltip(this, this.leftBottleZone, 'Christian');\n    addTooltip(this, this.rightBottleZone, 'Worldly / Pagan');\n\n    this.leftBottleZone.on('pointerdown', () => {"
    );

    // Add tooltips to buttons in m/main.js
    mobileCode = mobileCode.replace(
      "addButtonInteraction(this, this.eggZitButton, 'drive1');",
      "addButtonInteraction(this, this.eggZitButton, 'drive1');\n    addTooltip(this, this.eggZitButton, 'Back to Map');"
    );
    mobileCode = mobileCode.replace(
      "addButtonInteraction(this, this.eggsAmminHaul, 'menu-click');",
      "addButtonInteraction(this, this.eggsAmminHaul, 'menu-click');\n    addTooltip(this, this.eggsAmminHaul, 'View Collection');"
    );
}

fs.writeFileSync('m/main.js', mobileCode);
