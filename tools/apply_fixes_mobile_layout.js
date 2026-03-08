const fs = require('fs');

let mcode = fs.readFileSync('m/main.js', 'utf8');

// Update resize logic to recreate panel instead of just moving it
let resizeFunction = `  resize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    this.repositionUI(width, height);
  }

  repositionUI(width, height) {
    // Reposition gear
    if (this.gearIcon) {
        this.gearIcon.setPosition(width - 60, 60);
    }

    // Reposition settings panel
    if (this.settingsContainer) {
        const isVisible = this.settingsContainer.visible;
        this.settingsContainer.removeAll(true);
        this.createSettingsPanelContent(width, height);
        this.settingsContainer.setVisible(isVisible);
    }
  }`;

let oldResize = mcode.indexOf("  resize(gameSize) {");
let oldRepositionEnd = mcode.indexOf("  createGearIcon() {");

if (oldResize !== -1 && oldRepositionEnd !== -1) {
    mcode = mcode.substring(0, oldResize) + resizeFunction + "\n\n" + mcode.substring(oldRepositionEnd);
}

// Ensure the Math.min is in m/main.js for createSettingsPanelContent
let mathMinCheck = mcode.indexOf("const width = Math.min(maxWidth, screenWidth - margin * 2);");
if (mathMinCheck === -1) {
   let panelStart = mcode.indexOf("  createSettingsPanelContent(screenWidth, screenHeight) {");
   let overlayStart = mcode.indexOf("    // Overlay", panelStart);

   if (panelStart !== -1 && overlayStart !== -1) {
       let newPanelContent = `  createSettingsPanelContent(screenWidth, screenHeight) {
    // Dynamic sizing for responsiveness
    const maxWidth = 500;
    const maxHeight = 500;
    const margin = 20;
    const width = Math.min(maxWidth, screenWidth - margin * 2);
    const height = Math.min(maxHeight, screenHeight - margin * 2);
    const x = (screenWidth - width) / 2;
    const y = (screenHeight - height) / 2;

`;
       mcode = mcode.substring(0, panelStart) + newPanelContent + mcode.substring(overlayStart);
   }
}

// Now ensure we update overlay logic
let overlayCheck = mcode.indexOf("const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7)");
if (overlayCheck === -1) {
    let oldOverlayStart = mcode.indexOf("    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)");
    let oldOverlayEnd = mcode.indexOf("    // Panel Background");
    if (oldOverlayStart !== -1 && oldOverlayEnd !== -1) {
        let newOverlay = `    // Overlay
    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7)
        .setOrigin(0)
        .setInteractive();
    this.settingsContainer.add(overlay);

`;
        mcode = mcode.substring(0, oldOverlayStart) + newOverlay + mcode.substring(oldOverlayEnd);
    }
}

fs.writeFileSync('m/main.js', mcode);
