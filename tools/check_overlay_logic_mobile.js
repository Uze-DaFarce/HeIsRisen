const fs = require('fs');

let code = fs.readFileSync('m/main.js', 'utf8');
if (code.includes('const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7)')) {
    console.log("Overlay is scaling with screenWidth!");
} else {
    console.log("Overlay logic missing.");
}
