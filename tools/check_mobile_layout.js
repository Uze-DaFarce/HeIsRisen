const fs = require('fs');

let code = fs.readFileSync('m/main.js', 'utf8');
if (code.includes('const width = Math.min(maxWidth, screenWidth - margin * 2);')) {
    console.log("It's already there in m/main.js!");
} else {
    console.log("It's missing.");
}
