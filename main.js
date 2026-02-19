// Define all scene classes first
const TOTAL_EGGS = 60;

class MusicScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MusicScene' });
    this.musicVolume = 0.5;
    this.ambientVolume = 0.5;
    this.sfxVolume = 0.5;
  }

  create() {
    // console.log('MusicScene: checking background music');
    const music = this.sound.get('background-music');
    if (!music) {
      this.sound.add('background-music', { loop: true, volume: this.musicVolume }).play();
      // console.log('MusicScene: Background music started');
    } else if (!music.isPlaying) {
      // Ensure volume is updated if restarting
      music.setVolume(this.musicVolume);
      music.play();
      // console.log('MusicScene: Background music resumed');
    }

    // Schedule ambient1 to play randomly every 1-3 minutes
    this.scheduleAmbientSound();

    // Listen for volume changes via Registry
    this.registry.events.on('changedata', (parent, key, data) => {
      if (key === 'musicVolume') {
        this.musicVolume = data;
        const bgMusic = this.sound.get('background-music');
        if (bgMusic) bgMusic.setVolume(this.musicVolume);
      } else if (key === 'ambientVolume') {
        this.ambientVolume = data;
      } else if (key === 'sfxVolume') {
        this.sfxVolume = data;
      }
    });

    // Initialize from registry if available
    if (this.registry.has('musicVolume')) this.musicVolume = this.registry.get('musicVolume');
    if (this.registry.has('ambientVolume')) this.ambientVolume = this.registry.get('ambientVolume');
    if (this.registry.has('sfxVolume')) this.sfxVolume = this.registry.get('sfxVolume');
  }

  scheduleAmbientSound() {
    const delay = Phaser.Math.Between(60000, 180000); // 1-3 minutes in ms
    // console.log(`MusicScene: Scheduling ambient1 in ${delay}ms`);
    this.time.delayedCall(delay, () => {
      this.sound.play('ambient1', { volume: this.ambientVolume });
      this.scheduleAmbientSound(); // Reschedule
    });
  }

  playSFX(key) {
    // Simply play the sound. If not in cache, Phaser will warn internally,
    // but usually 'add' isn't needed for one-shot SFX if loaded.
    // If it's not added yet, we can try adding it, but play() usually handles it if the key exists.
    if (this.cache.audio.exists(key)) {
        this.sound.play(key, { volume: this.sfxVolume });
    } else {
        console.warn(`MusicScene: Audio key '${key}' missing from cache!`);
    }
  }
}

class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.createGearIcon();
    this.createSettingsPanel();

    // Custom cursor (Desktop only)
    if (this.sys.game.device.os.desktop) {
        this.fingerCursor = this.add.image(0, 0, 'finger-cursor')
            .setOrigin(0.5, 0.5)
            .setDisplaySize(50, 75)
            .setDepth(1000); // Ensure it's on top of everything
    }
  }

  update() {
    if (this.fingerCursor) {
        this.fingerCursor.setPosition(this.input.x, this.input.y);
    }
  }

  createGearIcon() {
    const gear = this.add.graphics();
    const x = this.cameras.main.width - 40;
    const y = 40;
    this.drawGear(gear, x, y);

    const hitArea = new Phaser.Geom.Circle(x, y, 30);
    gear.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    gear.on('pointerdown', () => {
        this.openSettings();
    });

    this.gearIcon = gear;
  }

  drawGear(graphics, x, y) {
    graphics.fillStyle(0xffffff, 1);
    const radius = 15;
    graphics.fillCircle(x, y, radius);

    // Teeth
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const tx = x + Math.cos(angle) * (radius + 4);
        const ty = y + Math.sin(angle) * (radius + 4);
        graphics.fillCircle(tx, ty, 5);
    }
    graphics.fillCircle(x, y, radius); // Redraw center to smooth

    // Inner hole
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(x, y, 6);
  }

  createSettingsPanel() {
    const width = 500;
    const height = 500;
    const x = (this.cameras.main.width - width) / 2;
    const y = (this.cameras.main.height - height) / 2;

    this.settingsContainer = this.add.container(0, 0).setVisible(false).setDepth(100);

    // Overlay
    const overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
        .setOrigin(0)
        .setInteractive(); // Block clicks

    this.settingsContainer.add(overlay);

    // Panel
    const panel = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2, width, height, 0x333333)
        .setStrokeStyle(4, 0xffffff);
    this.settingsContainer.add(panel);

    // Title
    const title = this.add.text(this.cameras.main.width / 2, y + 50, 'Audio Settings', {
        fontSize: '32px',
        fontFamily: 'Comic Sans MS',
        fill: '#ffffff'
    }).setOrigin(0.5);
    this.settingsContainer.add(title);

    // Close Button
    const closeBtn = this.add.text(x + width - 50, y + 50, 'X', {
        fontSize: '32px',
        fontFamily: 'Arial',
        fill: '#ff0000'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
        this.settingsContainer.setVisible(false);
        this.gearIcon.setVisible(true);
    });
    this.settingsContainer.add(closeBtn);

    // Sliders
    this.createSlider('Music', y + 150, 'music');
    this.createSlider('Ambient', y + 250, 'ambient');
    this.createSlider('SFX', y + 350, 'sfx');
  }

  createSlider(label, y, type) {
    const centerX = this.cameras.main.width / 2;
    const startX = centerX - 100;
    const endX = centerX + 100;

    const text = this.add.text(centerX, y - 30, label, {
        fontSize: '24px',
        fontFamily: 'Comic Sans MS',
        fill: '#ffffff'
    }).setOrigin(0.5);
    this.settingsContainer.add(text);

    const track = this.add.rectangle(centerX, y + 10, 200, 4, 0x888888);
    this.settingsContainer.add(track);

    // Handle
    let currentVol = 0.5;
    // Check registry first
    if (type === 'music' && this.registry.has('musicVolume')) currentVol = this.registry.get('musicVolume');
    else if (type === 'ambient' && this.registry.has('ambientVolume')) currentVol = this.registry.get('ambientVolume');
    else if (type === 'sfx' && this.registry.has('sfxVolume')) currentVol = this.registry.get('sfxVolume');

    const handleX = startX + (currentVol * 200);
    const handle = this.add.circle(handleX, y + 10, 12, 0xffffff).setInteractive({ draggable: true });
    this.settingsContainer.add(handle);

    handle.on('drag', (pointer, dragX, dragY) => {
        const clampedX = Phaser.Math.Clamp(dragX, startX, endX);
        handle.x = clampedX;

        const volume = (clampedX - startX) / 200;

        // Update Registry which triggers events
        if (type === 'music') this.registry.set('musicVolume', volume);
        else if (type === 'ambient') this.registry.set('ambientVolume', volume);
        else if (type === 'sfx') this.registry.set('sfxVolume', volume);
    });
  }

  openSettings() {
    this.settingsContainer.setVisible(true);
    this.gearIcon.setVisible(false);
  }
}

class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  preload() {
    // Bolt Optimization: Centralized asset preloading to prevent gameplay stutter
    const loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Loading...', {
        font: '24px monospace',
        fill: '#ffffff'
    }).setOrigin(0.5);

    this.load.json('symbols', 'assets/symbols.json');
    this.load.json('map_sections', 'assets/map/map_sections.json');
    // Replace title-page image with intro video
    this.load.video('intro-video', 'assets/intro-video.mp4');
    this.load.image('finger-cursor', 'assets/cursor/pointer-finger-pointer.png');

    // Preload common UI and game assets here to avoid reloading in scenes
    this.load.image('yellowstone-main-map', 'assets/map/yellowstone-main-map.png');
    this.load.image('eggs-ammin-haul', 'assets/objects/eggs-ammin-haul.png');
    this.load.image('score', 'assets/objects/score.png');
    this.load.image('magnifying-glass', 'assets/cursor/magnifying-glass.png');
    this.load.image('egg-zit-button', 'assets/objects/egg-zit-button.png');
    this.load.image('egg-zam-room', 'assets/map/egg-zam-room.png');
    this.load.image('egg-zamminer', 'assets/objects/egg-zamminer.png');
    this.load.image('symbol-result-summary-diag', 'assets/objects/symbol-result-summary-diag.png');

    // Audio assets
    this.load.audio('background-music', 'assets/audio/background-music.mp3');
    this.load.audio('collect', 'assets/audio/collect1.mp3');
    this.load.audio('success', 'assets/audio/success.wav');
    this.load.audio('error', 'assets/audio/error.wav');
    // intro-music removed as it is now part of the video
    this.load.audio('ambient1', 'assets/audio/ambient1.mp3');
    this.load.audio('menu-click', 'assets/audio/menu-click.mp3');
    this.load.audio('drive1', 'assets/audio/drive1.mp3');
    this.load.audio('drive2', 'assets/audio/drive2.mp3');

    this.load.on('filecomplete-json-map_sections', (key, type, data) => {
      // console.log(`MainMenu: filecomplete-json-map_sections: Key='${key}', Type='${type}'`);
      if (Array.isArray(data)) {
        data.forEach(section => {
             // Preload section SVGs using the same naming convention as SectionHunt
             this.load.svg(section.name, `assets/map/sections/${section.name}.svg`);
        });
        // console.log(`MainMenu: Queued ${data.length} section SVGs for loading.`);
      }
    });

    this.load.on('filecomplete-json-symbols', (key, type, data) => {
      // console.log(`MainMenu: filecomplete-json-symbols: Key='${key}', Type='${type}'`);
      // Preload all 60 eggs
      for (let i = 1; i <= TOTAL_EGGS; i++) {
        this.load.image(`egg-${i}`, `assets/eggs/egg-${i}.png`);
      }
      // Preload all symbols
      if (data && data.symbols) {
        data.symbols.forEach(symbol => {
          if (symbol.filename) {
            this.load.image(symbol.filename, symbol.filename);
          }
        });
      }
    });

    this.load.on('complete', () => {
        loadingText.destroy();
    });

    this.load.on('loaderror', (file) => {
      console.error(`MainMenu: Load error: Key='${file.key}', URL='${file.url}'`);
    });
  }

  create() {
    this.input.setDefaultCursor('none');

    // Add Intro Video (replaces title-page image)
    // Assuming video has baked-in audio that should loop
    const musicVol = this.registry.get('musicVolume') || 0.5;
    this.introVideo = this.add.video(640, 360, 'intro-video');

    // Configure video
    this.introVideo.setDisplaySize(1280, 720);
    this.introVideo.setVolume(musicVol);
    this.introVideo.play(true); // true = loop
    this.introVideo.setPaused(false);

    // Text overlay on top of video
    this.add.text(520, 0, `He Is Risen!`, { fontSize: '126px', fill: '#000', fontStyle: 'bold', fontFamily: 'Comic Sans MS', stroke: '#fff', strokeThickness: 20 });
    this.add.text(0, 522, `Hunt with P.A.L.`, { fontSize: '62px', fill: '#000', fontStyle: 'bold', fontFamily: 'Comic Sans MS', stroke: '#fff', strokeThickness: 6 });
    this.add.text(0, 580, `for the Meaning of Easter`, { fontSize: '62px', fill: '#000', fontStyle: 'bold', fontFamily: 'Comic Sans MS', stroke: '#fff', strokeThickness: 6 });

    // Modified start text instructions
    const startText = this.add.text(640, 680, 'Click to Start', {
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    const startGame = () => {
      // Stop video to prevent audio overlap
      if (this.introVideo) {
        this.introVideo.stop();
        this.introVideo.destroy();
        this.introVideo = null;
      }

      if (!this.scene.get('MusicScene').scene.isActive()) {
        this.scene.launch('MusicScene');
      }
      const musicScene = this.scene.get('MusicScene');
      if (musicScene) {
        this.sound.play('drive1', { volume: 0.5 });
      }
      this.scene.start('MapScene');
    };

    this.input.keyboard.on('keydown-SPACE', startGame);
    this.input.keyboard.on('keydown-ENTER', startGame);

    this.fingerCursor = this.add.image(0, 0, 'finger-cursor').setOrigin(0.5, 0.5).setDisplaySize(50, 75);

    // Instead of starting game on any pointerdown, make startText interactive
    startText.setInteractive({ useHandCursor: true }).on('pointerdown', startGame);

    // Initialize volume registry
    if (!this.registry.has('musicVolume')) this.registry.set('musicVolume', 0.5);
    if (!this.registry.has('ambientVolume')) this.registry.set('ambientVolume', 0.5);
    if (!this.registry.has('sfxVolume')) this.registry.set('sfxVolume', 0.5);

    // Launch UI Scene
    if (!this.scene.get('UIScene').scene.isActive()) {
        this.scene.launch('UIScene');
    }

    // ROBUST AUTOPLAY STRATEGY FOR VIDEO
    // Update intro volume if changed in settings
    const updateIntroVolume = (parent, key, data) => {
        if (key === 'musicVolume' && this.introVideo) {
            this.introVideo.setVolume(data);
        }
    };
    this.registry.events.on('changedata', updateIntroVolume);

    const unlockVideo = () => {
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }
        if (this.introVideo && !this.introVideo.isPlaying()) {
            this.introVideo.play(true);
            this.introVideo.setMute(false);
        }
    };

    // Try to unlock immediately
    unlockVideo();

    // Unlock on any pointer or keyboard interaction
    this.input.on('pointerdown', unlockVideo);
    this.input.keyboard.on('keydown', unlockVideo);

    // Cleanup listeners when starting game
    this.events.once('shutdown', () => {
        this.registry.events.off('changedata', updateIntroVolume);
        this.input.off('pointerdown', unlockVideo);
        this.input.keyboard.off('keydown', unlockVideo);
        if (this.introVideo) {
            this.introVideo.stop();
            this.introVideo.destroy();
            this.introVideo = null;
        }
    });

    // console.log('MainMenu: Attempting to get symbols data from cache...');
    const symbolsData = this.cache.json.get('symbols');

    if (symbolsData) {
      // console.log('MainMenu: Found symbols data in cache:', symbolsData);
      if (symbolsData.symbols && Array.isArray(symbolsData.symbols)) {
        // console.log(`MainMenu: Data contains a 'symbols' array with ${symbolsData.symbols.length} items. Setting registry...`);
        this.registry.set('symbols', symbolsData);
        const checkRegistry = this.registry.get('symbols');
        if (checkRegistry) {
          // console.log('MainMenu: Successfully set and verified symbols in registry:', checkRegistry);
        } else {
          console.error('MainMenu: FAILED to verify symbols in registry immediately after setting!');
        }
      } else {
        console.error("MainMenu: ERROR - symbolsData loaded, but it does NOT contain a 'symbols' array property! Check assets/symbols.json structure.", symbolsData);
      }
    } else {
      console.error('MainMenu: ERROR - Failed to get symbols data from cache. Check the preload path and Network tab for loading errors.');
    }
  }

  update() {
    this.fingerCursor.setPosition(this.input.x, this.input.y);
  }
}

class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  create() {
    this.input.setDefaultCursor('none');
    const mapSections = this.cache.json.get('map_sections');

    // Distribute eggs randomly (3-8 per section) while summing to TOTAL_EGGS
    const eggCounts = [];
    let remainingEggs = TOTAL_EGGS;
    const numSections = mapSections.length;

    for (let i = 0; i < numSections - 1; i++) {
        // Calculate max possible for this section to leave at least 3 for remaining sections
        const maxPossible = remainingEggs - ((numSections - 1 - i) * 3);
        // Calculate min possible for this section to leave at most 8 for remaining sections
        const minPossible = remainingEggs - ((numSections - 1 - i) * 8);

        const max = Math.min(8, maxPossible);
        const min = Math.max(3, minPossible);

        const count = Phaser.Math.Between(min, max);
        eggCounts.push(count);
        remainingEggs -= count;
    }
    eggCounts.push(remainingEggs); // Last section gets the rest

    const eggs = Phaser.Utils.Array.Shuffle(Array.from({ length: TOTAL_EGGS }, (_, i) => i + 1));
    const sections = mapSections.map(section => ({ name: section.name, eggs: [] }));

    let eggIndex = 0;
    sections.forEach((section, index) => {
      section.eggs = eggs.slice(eggIndex, eggIndex + eggCounts[index]);
      eggIndex += eggCounts[index];
    });

    this.registry.set('sections', sections);
    if (!this.registry.has('foundEggs')) {
      this.registry.set('foundEggs', []);
    }

    if (!this.scene.get('MusicScene').scene.isActive()) {
      this.scene.launch('MusicScene');
    }
    this.sound.play('drive2', { volume: 0.5 });

    const mapImage = this.add.image(0, 0, 'yellowstone-main-map').setOrigin(0, 0);
    // console.log(`Map display size: ${mapImage.displayWidth}x${mapImage.displayHeight}, Position: (${mapImage.x}, ${mapImage.y})`);
    mapSections.forEach(section => {
      const zoneX = section.coords.x;
      const zoneY = section.coords.y;
      const zoneWidth = section.coords.width;
      const zoneHeight = section.coords.height;
      const zone = this.add.zone(zoneX, zoneY, zoneWidth, zoneHeight).setOrigin(0, 0);
      zone.setInteractive();
      zone.on('pointerdown', () => {
        // console.log(`Clicked ${section.name} at (${zoneX}, ${zoneY})`);
        this.sound.play('drive1', { volume: 0.5 });
        this.scene.start('SectionHunt', { sectionName: section.name });
      });
    });

    const eggsAmminHaul = this.add.image(0, 200, 'eggs-ammin-haul').setOrigin(0, 0).setDisplaySize(137, 150)
      .setInteractive();

    addButtonInteraction(this, eggsAmminHaul, 'menu-click');

    // Delayed transition to allow sound and animation to play
    eggsAmminHaul.on('pointerdown', () => {
         this.time.delayedCall(100, () => {
             this.scene.start('EggZamRoom');
         });
    });

    this.add.image(0, 0, 'score').setOrigin(0, 0).setDisplaySize(200, 200);
    const foundEggs = this.registry.get('foundEggs').length;
    this.add.text(50, 98, `${foundEggs}/${TOTAL_EGGS}`, { fontSize: '42px', fill: '#000', fontStyle: 'bold', fontFamily: 'Comic Sans MS', stroke: '#fff', strokeThickness: 6 });
    this.fingerCursor = this.add.image(0, 0, 'finger-cursor').setOrigin(0.5, 0.5).setDisplaySize(50, 75);
  }

  update() {
    this.fingerCursor.setPosition(this.input.x, this.input.y);
  }
}

class SectionHunt extends Phaser.Scene {
  constructor() {
    super({ key: 'SectionHunt' });
  }

  init(data) {
    this.sectionName = data.sectionName;
  }

  collectEgg(egg) {
    const foundEggs = this.registry.get('foundEggs');
    const eggData = {
      eggId: egg.getData('eggId'),
      symbolData: egg.getData('symbolDetails'),
      categorized: false
    };
    // console.log('SectionHunt: Collecting egg with symbolData:', eggData.symbolData);
    if (!foundEggs.some(e => e.eggId === eggData.eggId)) {
      this.sound.play('collect');
      foundEggs.push(eggData);
      this.registry.set('foundEggs', foundEggs);
      // console.log('Egg collected:', eggData.eggId, 'with symbol:', eggData.symbolData ? eggData.symbolData.name : 'none');
    }
  }

  create() {
    this.input.setDefaultCursor('none');
    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.sectionImage = this.add.image(0, 0, this.sectionName).setOrigin(0, 0).setDisplaySize(1280, 720).setDepth(0);
    const symbolsData = this.registry.get('symbols');
    const symbols = (symbolsData && symbolsData.symbols) ? symbolsData.symbols : [];
    if (!symbols.length) {
      console.error('Symbols data not found in registry for create method. Cannot place symbols.');
    }
    const shuffledSymbols = Phaser.Utils.Array.Shuffle([...symbols]);
    const sections = this.registry.get('sections');
    const section = sections.find(s => s.name === this.sectionName);
    if (!section) {
      console.error(`Section data not found for: ${this.sectionName} in create`);
      return;
    }
    this.eggs = this.add.group();
    // console.log(`Creating ${section.eggs.length} eggs for section ${this.sectionName}`);
    section.eggs.forEach((eggId, index) => {
      const x = Phaser.Math.Between(200, 1270);
      const y = Phaser.Math.Between(100, 710);
      const egg = this.add.image(x, y, `egg-${eggId}`)
        .setInteractive()
        .setDepth(5)
        .setDisplaySize(50, 75)
        .setAlpha(0);
      egg.setData('eggId', eggId);
      const symbol = (index < shuffledSymbols.length) ? shuffledSymbols[index] : null;
      egg.setData('symbolDetails', symbol);
      if (symbol && symbol.filename) {
        const textureKey = symbol.filename;
        if (this.textures.exists(textureKey)) {
          const symbolSprite = this.add.image(x, y, textureKey)
            .setDepth(6)
            .setDisplaySize(50, 75)
            .setAlpha(0);
          egg.symbolSprite = symbolSprite;
          // console.log(`Added symbol '${symbol.name}' (${textureKey}) to egg-${eggId}`);
        } else {
          console.warn(`CREATE WARN: Texture key '${textureKey}' not found for symbol '${symbol.name}'. Check preload path.`);
          egg.symbolSprite = null;
        }
      } else {
        // console.log(`No symbol assigned or symbol missing filename for egg-${eggId}. Index: ${index}`);
        egg.symbolSprite = null;
      }
      egg.on('pointerdown', () => {
        // console.log(`Click ATTEMPTED on egg-${eggId} at (${egg.x}, ${egg.y})`);
        const pointer = this.input.activePointer;
        if (egg.getBounds().contains(pointer.worldX, pointer.worldY)) {
          // console.log(`Bounds check PASSED for egg-${eggId}`);
          const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, egg.x, egg.y);
          if (distance < 150) {
            // console.log(`Distance check PASSED for egg-${eggId}, collecting!`);
            this.collectEgg(egg);
            egg.destroy();
            if (egg.symbolSprite) {
              egg.symbolSprite.destroy();
            }
            const foundEggs = this.registry.get('foundEggs').length;
            if (this.scoreText) {
              this.scoreText.setText(`${foundEggs}/${TOTAL_EGGS}`);
            } else {
              console.warn('scoreText not found when updating score.');
            }
          } else {
            // console.log(`Distance check FAILED for egg-${eggId}. Dist: ${distance}`);
          }
        } else {
          // console.log(`Bounds check FAILED for egg-${eggId}`);
        }
      });
      this.eggs.add(egg);
    });
    const eggZitButton = this.add.image(0, 200, 'egg-zit-button').setOrigin(0, 0).setDisplaySize(150, 131)
      .setInteractive().on('pointerdown', () => {
        // console.log('Click on eggZitButton');
        this.scene.start('MapScene');
      }).setDepth(4).setScrollFactor(0);
    addButtonInteraction(this, eggZitButton, 'drive1');

    const eggsAmminHaul = this.add.image(0, 350, 'eggs-ammin-haul').setOrigin(0, 0).setDisplaySize(137, 150)
      .setInteractive().on('pointerdown', () => {
        // console.log('Click on eggsAmminHaul');
        this.scene.start('EggZamRoom');
      }).setDepth(4).setScrollFactor(0);
    addButtonInteraction(this, eggsAmminHaul, 'menu-click');

    // Delayed transition to allow sound and animation to play
    eggsAmminHaul.on('pointerdown', () => {
        // console.log('Click on eggsAmminHaul');
        this.time.delayedCall(100, () => {
             this.scene.start('EggZamRoom');
        });
    });

    this.sound.play('drive2', { volume: 0.5 });
    this.add.image(0, 0, 'score').setOrigin(0, 0).setDisplaySize(200, 200).setDepth(4).setScrollFactor(0);
    const foundEggs = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(50, 98, `${foundEggs}/${TOTAL_EGGS}`, { fontSize: '42px', fill: '#000', fontStyle: 'bold', fontFamily: 'Comic Sans MS', stroke: '#fff', strokeThickness: 6 }).setDepth(5);
    this.zoomedView = this.add.renderTexture(0, 0, 200, 200).setDepth(2).setScrollFactor(0);
    this.maskGraphics = this.add.graphics().fillCircle(50, 50, 50).setScrollFactor(0);
    this.zoomedView.setMask(this.maskGraphics.createGeometryMask());
    this.magnifyingGlass = this.add.image(0, 0, 'magnifying-glass').setOrigin(0.25, 0.2).setDepth(7).setScrollFactor(0);
  }

  update() {
    const pointer = this.input.activePointer;
    const offset = 35;
    const rtX = pointer.x + offset - 75;
    const rtY = pointer.y + offset - 53;
    this.zoomedView.setPosition(rtX, rtY);
    this.maskGraphics.setPosition(rtX, rtY);
    this.zoomedView.camera.setZoom(2);
    const centerX = pointer.x + offset;
    const centerY = pointer.y + offset;
    const worldCenter = this.cameras.main.getWorldPoint(centerX, centerY);
    this.zoomedView.camera.scrollX = worldCenter.x - 150;
    this.zoomedView.camera.scrollY = worldCenter.y - 150;
    const magnifierRadius = 50;
    const magnifierScreenX = pointer.x;
    const magnifierScreenY = pointer.y;
    this.eggs.getChildren().forEach(egg => {
      if (egg && egg.active) {
        const distance = Phaser.Math.Distance.Between(magnifierScreenX, magnifierScreenY, egg.x, egg.y);
        const alpha = distance < magnifierRadius ? 1 : 0;
        egg.setAlpha(alpha);
        if (egg.symbolSprite) {
          egg.symbolSprite.setAlpha(alpha);
        }
      }
    });
    this.zoomedView.clear();
    this.zoomedView.draw(this.sectionImage, 0, 0);
    this.eggs.getChildren().forEach(egg => {
      if (egg.active && egg.visible && egg.alpha > 0) {
        this.zoomedView.draw(egg, egg.x - this.zoomedView.camera.scrollX, egg.y - this.zoomedView.camera.scrollY);
        if (egg.symbolSprite && egg.symbolSprite.active && egg.symbolSprite.visible && egg.symbolSprite.alpha > 0) {
          this.zoomedView.draw(egg.symbolSprite, egg.symbolSprite.x - this.zoomedView.camera.scrollX, egg.symbolSprite.y - this.zoomedView.camera.scrollY);
        }
      }
    });
    this.magnifyingGlass.setPosition(pointer.x, pointer.y);
    const foundEggsCount = this.registry.get('foundEggs').length;
    this.scoreText.setText(`${foundEggsCount}/${TOTAL_EGGS}`);
  }
}

class EggZamRoom extends Phaser.Scene {
  constructor() {
    super({ key: 'EggZamRoom' });
    this.displayedEggImage = null;
    this.displayedSymbolImage = null;
    this.explanationText = null;
    this.noEggsText = null;
    this.currentEgg = null;
  }

  create() {
    this.input.setDefaultCursor('none');
    this.cameras.main.setBounds(0, 0, 1280, 720);

    this.add.image(0, 0, 'egg-zam-room')
      .setOrigin(0, 0)
      .setDepth(0)
      .setDisplaySize(1280, 720);
    // console.log('EggZamRoom: Added background image at (0, 0) with size 1280x720');

    const examiner = this.add.image(390, 250, 'egg-zamminer')
      .setOrigin(0, 0)
      .setDepth(2);
    // console.log('EggZamRoom: Added egg-zamminer at (390, 250)');

    this.add.image(200, 50, 'symbol-result-summary-diag')
      .setOrigin(0, 0)
      .setDisplaySize(900, 600)
      .setDepth(1)
      .setAlpha(0);
    // console.log('EggZamRoom: Added symbol-result-summary-diag at (200, 50)');

    const eggZitButton = this.add.image(0, 200, 'egg-zit-button')
      .setOrigin(0, 0)
      .setDisplaySize(150, 131)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MapScene'))
      .setDepth(4)
      .setScrollFactor(0);
    addButtonInteraction(this, eggZitButton, 'drive1');
    // console.log('EggZamRoom: Added egg-zit-button at (0, 200)');

    this.add.image(0, 0, 'score')
      .setOrigin(0, 0)
      .setDisplaySize(200, 200)
      .setDepth(4)
      .setScrollFactor(0);
    const foundEggsCount = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(50, 98, `${foundEggsCount}/${TOTAL_EGGS}`, {
      fontSize: '42px',
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6
    }).setDepth(5);
    // console.log('EggZamRoom: Added score at (0, 0) with text:', `${foundEggsCount}/${TOTAL_EGGS}`);

    if (!this.registry.has('correctCategorizations')) {
      this.registry.set('correctCategorizations', 0);
    }

    this.correctText = this.add.text(100, 150, `Correct: ${this.registry.get('correctCategorizations')}`, {
      fontSize: '32px',
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6
    }).setDepth(5);
    // console.log('EggZamRoom: Added correct categorization text at (100, 150)');

    const leftBottleZone = this.add.zone(450, 300, 100, 200).setOrigin(0, 0).setInteractive();
    const rightBottleZone = this.add.zone(750, 300, 100, 200).setOrigin(0, 0).setInteractive();

    leftBottleZone.on('pointerdown', () => {
      if (this.currentEgg && !this.currentEgg.categorized) {
        // console.log('Left bottle clicked. Current egg symbolData:', this.currentEgg.symbolData);
        const isChristian = this.currentEgg.symbolData.category === 'Christian';
        if (isChristian) {
          this.sound.play('success');
          const correctCount = this.registry.get('correctCategorizations') + 1;
          this.registry.set('correctCategorizations', correctCount);
          this.correctText.setText(`Correct: ${correctCount}`);
          this.currentEgg.categorized = true;
          this.displayRandomEggInfo();
          // console.log('Correct categorization: Egg is Christian, left bottle clicked');
        } else {
          this.sound.play('error');
          const wrongText = this.add.text(420, 220, "Try again!", {
            fontSize: '28px',
            fill: '#f00',
            fontStyle: 'bold',
            fontFamily: 'Comic Sans MS'
          }).setOrigin(0, 0).setDepth(4).setScrollFactor(0);
          this.time.delayedCall(1000, () => wrongText.destroy(), [], this);
          // console.log('Incorrect categorization: Egg is Pagan, left bottle clicked');
        }
      }
    });

    rightBottleZone.on('pointerdown', () => {
      if (this.currentEgg && !this.currentEgg.categorized) {
        // console.log('Right bottle clicked. Current egg symbolData:', this.currentEgg.symbolData);
        const isPagan = this.currentEgg.symbolData.category === 'Pagan';
        if (isPagan) {
          this.sound.play('success');
          const correctCount = this.registry.get('correctCategorizations') + 1;
          this.registry.set('correctCategorizations', correctCount);
          this.correctText.setText(`Correct: ${correctCount}`);
          this.currentEgg.categorized = true;
          this.displayRandomEggInfo();
          // console.log('Correct categorization: Egg is Pagan, right bottle clicked');
        } else {
          this.sound.play('error');
          const wrongText = this.add.text(420, 220, "Try again!", {
            fontSize: '28px',
            fill: '#f00',
            fontStyle: 'bold',
            fontFamily: 'Comic Sans MS'
          }).setOrigin(0, 0).setDepth(4).setScrollFactor(0);
          this.time.delayedCall(1000, () => wrongText.destroy(), [], this);
          // console.log('Incorrect categorization: Egg is Christian, right bottle clicked');
        }
      }
    });

    this.displayRandomEggInfo();

    this.fingerCursor = this.add.image(0, 0, 'finger-cursor')
      .setOrigin(0.5, 0.5)
      .setDisplaySize(50, 75)
      .setDepth(7);
  }

  displayRandomEggInfo() {
    const foundEggs = this.registry.get('foundEggs');

    if (this.currentEgg === null || this.currentEgg.categorized) {
      const uncategorizedEggs = foundEggs.filter(egg => !egg.categorized);
      if (uncategorizedEggs.length > 0) {
        this.currentEgg = Phaser.Utils.Array.GetRandom(uncategorizedEggs);
        // console.log('Displaying new egg. SymbolData:', this.currentEgg.symbolData);
      } else {
        this.currentEgg = null;
        if (this.noEggsText) this.noEggsText.destroy();
        this.noEggsText = this.add.text(420, 220, "All eggs have been categorized!", {
          fontSize: '28px',
          fill: '#000',
          fontStyle: 'bold',
          fontFamily: 'Comic Sans MS',
          stroke: '#fff',
          strokeThickness: 3,
          wordWrap: { width: 480, useAdvancedWrap: true }
        }).setOrigin(0, 0);
        return;
      }
    }

    if (this.displayedEggImage) this.displayedEggImage.destroy();
    if (this.displayedSymbolImage) this.displayedSymbolImage.destroy();
    if (this.explanationText) this.explanationText.destroy();
    if (this.noEggsText) this.noEggsText.destroy();

    if (this.currentEgg) {
      const { eggId, symbolData } = this.currentEgg;
      const eggPosX = 630; // Updated position
      const eggPosY = 350; // Updated position
      const symbolPosX = eggPosX + 0; // Updated position
      const symbolPosY = eggPosY + 0; // Updated position
      if (this.textures.exists(`egg-${eggId}`)) {
        this.displayedEggImage = this.add.image(eggPosX, eggPosY, `egg-${eggId}`)
          .setDisplaySize(100, 125)
          .setDepth(3);
      }
      if (symbolData && symbolData.filename && this.textures.exists(symbolData.filename)) {
        this.displayedSymbolImage = this.add.image(symbolPosX, symbolPosY, symbolData.filename)
          .setDisplaySize(100, 125)
          .setDepth(3);
      }
    }
  }

  update() {
    const foundEggsCount = this.registry.get('foundEggs').length;
    if (this.scoreText) {
      this.scoreText.setText(`${foundEggsCount}/${TOTAL_EGGS}`);
    }
    this.fingerCursor.setPosition(this.input.x, this.input.y);
  }
}

/**
 * Adds a "pop" animation to a game object on hover.
 * @param {Phaser.Scene} scene - The scene the object belongs to.
 * @param {Phaser.GameObjects.GameObject} button - The game object to animate.
 * @param {string} [soundKey='success'] - The key of the sound to play on click.
 */
function addButtonInteraction(scene, button, soundKey = 'success') {
  const originalScaleX = button.scaleX;
  const originalScaleY = button.scaleY;
  let isHovered = false;

  button.on('pointerover', () => {
    isHovered = true;
    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scaleX: originalScaleX * 1.1,
      scaleY: originalScaleY * 1.1,
      duration: 100,
      ease: 'Power1'
    });
  });

  button.on('pointerout', () => {
    isHovered = false;
    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scaleX: originalScaleX,
      scaleY: originalScaleY,
      duration: 100,
      ease: 'Power1'
    });
  });

  button.on('pointerdown', () => {
    // Try to play sound via MusicScene if available to ensure persistence
    const musicScene = scene.scene.get('MusicScene');
    if (musicScene && musicScene.scene.isActive()) {
        musicScene.playSFX(soundKey);
    } else if (soundKey && scene.sound.get(soundKey)) {
        scene.sound.play(soundKey, { volume: 0.5 });
    }

    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scaleX: originalScaleX * 0.9,
      scaleY: originalScaleY * 0.9,
      duration: 50,
      ease: 'Power1'
    });
  });

  button.on('pointerup', () => {
    const targetScale = isHovered ? 1.1 : 1.0;
    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scaleX: originalScaleX * targetScale,
      scaleY: originalScaleY * targetScale,
      duration: 100,
      ease: 'Power1'
    });
  });
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  scene: [MainMenu, MapScene, SectionHunt, EggZamRoom, MusicScene, UIScene],
  parent: 'game',
  backgroundColor: '#000000',
};

// Initialize the game
const game = new Phaser.Game(config);
