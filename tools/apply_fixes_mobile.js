const fs = require('fs');

let mobileCode = fs.readFileSync('m/main.js', 'utf8');

// --- ESC Toggle ---
mobileCode = mobileCode.replace(
  "    // Add ESC and ENTER key support to close settings\n    const closeSettings = () => {\n        if (this.settingsContainer && this.settingsContainer.visible) {\n            this.settingsContainer.setVisible(false);\n            if (this.gearIcon) this.gearIcon.setVisible(true);\n            this.input.setDefaultCursor('none');\n        }\n    };\n    if (this.input.keyboard) {\n        this.input.keyboard.on('keydown-ESC', closeSettings);\n        this.input.keyboard.on('keydown-ENTER', closeSettings);\n    }",
  "    // Add ESC and ENTER key support to toggle settings\n    const toggleSettings = () => {\n        if (this.settingsContainer && this.settingsContainer.visible) {\n            this.settingsContainer.setVisible(false);\n            if (this.gearIcon) this.gearIcon.setVisible(true);\n            this.input.setDefaultCursor('none');\n        } else {\n            this.openSettings();\n        }\n    };\n    if (this.input.keyboard) {\n        this.input.keyboard.on('keydown-ESC', toggleSettings);\n        this.input.keyboard.on('keydown-ENTER', () => { if (this.settingsContainer && this.settingsContainer.visible) toggleSettings(); });\n    }"
);

fs.writeFileSync('m/main.js', mobileCode);
