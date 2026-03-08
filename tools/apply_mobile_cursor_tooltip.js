const fs = require('fs');

let mobileCode = fs.readFileSync('m/main.js', 'utf8');

// --- Cursor Additions ---
mobileCode = mobileCode.replace(
  "function addButtonInteraction(scene, button, soundKey = 'success') {\n  button.on('pointerdown', () => {",
  "function addButtonInteraction(scene, button, soundKey = 'success') {\n  if (button.input) button.input.cursor = 'pointer';\n  button.on('pointerdown', () => {"
);

mobileCode = mobileCode.replace(
  "    this.leftBottleZone = this.add.zone(examinerX, zoneY, zoneWidth, zoneHeight)\n      .setOrigin(0, 0)\n      .setInteractive();",
  "    this.leftBottleZone = this.add.zone(examinerX, zoneY, zoneWidth, zoneHeight)\n      .setOrigin(0, 0)\n      .setInteractive();\n    this.leftBottleZone.input.cursor = 'pointer';"
);
mobileCode = mobileCode.replace(
  "    this.rightBottleZone = this.add.zone(examinerX + zoneWidth, zoneY, zoneWidth, zoneHeight)\n      .setOrigin(0, 0)\n      .setInteractive();",
  "    this.rightBottleZone = this.add.zone(examinerX + zoneWidth, zoneY, zoneWidth, zoneHeight)\n      .setOrigin(0, 0)\n      .setInteractive();\n    this.rightBottleZone.input.cursor = 'pointer';"
);

// --- Tooltip Copy from desktop ---
let desktopCode = fs.readFileSync('main.js', 'utf8');

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
    let tooltipCodeStr = lines.slice(startIdx, endIdx).join('\n').trim();

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
}

fs.writeFileSync('m/main.js', mobileCode);
