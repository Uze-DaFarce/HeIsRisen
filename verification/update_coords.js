const fs = require('fs');

// This script scales the detected circle coordinates from the new 1376x768 map
// down to the game's internal 1280x720 coordinate space, and overwrites map_sections.json.

const mapSectionsPath = '../assets/map/map_sections.json';
const mapSections = JSON.parse(fs.readFileSync(mapSectionsPath));

const newCoordsMap = {
    "mammoth-hot-springs": { x: 370, y: 154, width: 60, height: 60 },
    "norris-geyser-basin": { x: 343, y: 300, width: 60, height: 60 },
    "yellowstone-geology": { x: 457, y: 280, width: 60, height: 60 },
    "grand-canyon-yellowstone": { x: 575, y: 350, width: 60, height: 60 },
    "yellowstone-wildlife": { x: 673, y: 310, width: 60, height: 60 },
    "grand-prismatic": { x: 260, y: 470, width: 60, height: 60 },
    "yellowstone-hydrothermal": { x: 367, y: 470, width: 60, height: 60 },
    "yellowstone-history": { x: 624, y: 556, width: 60, height: 60 },
    "old-faithful": { x: 405, y: 593, width: 60, height: 60 },
    "west-thumb-geyser-basin": { x: 563, y: 642, width: 60, height: 60 },
    "yellowstone-preservation": { x: 418, y: 700, width: 60, height: 60 },
};

mapSections.forEach(section => {
    if (newCoordsMap[section.name]) {
        // Scale from 1376x768 to 1280x720 base coordinates
        const scaleX = 1280 / 1376;
        const scaleY = 720 / 768;
        const raw = newCoordsMap[section.name];
        section.coords = {
            x: Math.round(raw.x * scaleX) - 30,
            y: Math.round(raw.y * scaleY) - 30,
            width: 60,
            height: 60
        };
    }
});

fs.writeFileSync(mapSectionsPath, JSON.stringify(mapSections, null, 2));
console.log('Coordinates updated.');
