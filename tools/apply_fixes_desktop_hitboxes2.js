const fs = require('fs');
let desktopCode = fs.readFileSync('main.js', 'utf8');

// The error happens because `eggDrawEnd` matches the wrong `update() {`. There are multiple classes!
// In `EggZamRoom`, the `update() {` is the last one in the file.
// Let's restrict our search only to within the `displayRandomEggInfo` method.

let eggDrawStart = desktopCode.indexOf("    if (this.currentEgg) {");
// We only want the first one inside EggZamRoom
let startOfRoom = desktopCode.indexOf("class EggZamRoom extends Phaser.Scene {");
let actualStart = desktopCode.indexOf("    if (this.currentEgg) {", startOfRoom);

if (actualStart !== -1) {
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
    if (actualEnd !== -1) {
        let subEgg = desktopCode.substring(actualStart, actualEnd);
        desktopCode = desktopCode.replace(subEgg, newEggDraw);
    }
}
fs.writeFileSync('main.js', desktopCode);
