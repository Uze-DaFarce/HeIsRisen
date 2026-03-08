const fs = require('fs');
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


fs.writeFileSync('main.js', desktopCode);
