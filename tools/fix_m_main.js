const fs = require('fs');

let mcode = fs.readFileSync('m/main.js', 'utf8');

// The mobile version uses `this.game.config.width` instead of `this.cameras.main.width` for creating settings panel
let panelFixM = `  createSettingsPanelContent(screenWidth, screenHeight) {
    // Dynamic sizing for responsiveness
    const maxWidth = 500;
    const maxHeight = 500;
    const margin = 20;
    const width = Math.min(maxWidth, screenWidth - margin * 2);
    const height = Math.min(maxHeight, screenHeight - margin * 2);
    const x = (screenWidth - width) / 2;
    const y = (screenHeight - height) / 2;

    // Overlay
    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7)
        .setOrigin(0)
        .setInteractive();
    this.settingsContainer.add(overlay);`;

if (!mcode.includes("const width = Math.min(maxWidth, screenWidth - margin * 2);")) {
   console.log("Mobile didn't have math.min");
} else {
   console.log("Mobile already has math.min layout. Re-checking overlay logic.");

   // It looks like in mobile resize logic, the settings container is removed and re-added correctly:
   /*
    if (this.settingsContainer) {
        const isVisible = this.settingsContainer.visible;
        this.settingsContainer.removeAll(true);
        this.createSettingsPanelContent(width, height);
        this.settingsContainer.setVisible(isVisible);
    }
   */
   if (mcode.includes("this.settingsContainer.removeAll(true);")) {
      console.log("Mobile already has dynamic resizing overlay logic.");
   }
}
