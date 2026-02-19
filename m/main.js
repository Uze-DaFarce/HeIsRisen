/* -= main.js =- */
// Define total eggs as a variable to avoid hardcoding
const TOTAL_EGGS = 60;

// Define all scene classes first

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

    // Listen for resize events to update UI positions
    this.scale.on('resize', this.resize, this);
  }

  update() {
    if (this.fingerCursor) {
        this.fingerCursor.setPosition(this.input.x, this.input.y);
    }
  }

  resize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    this.repositionUI(width, height);
  }

  repositionUI(width, height) {
    // Reposition gear
    if (this.gearIcon) {
        this.gearIcon.clear();
        this.drawGear(this.gearIcon, width - 40, 40);
        // Update hit area
        const hitArea = new Phaser.Geom.Circle(width - 40, 40, 30);
        this.gearIcon.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    }

    // Reposition settings panel
    if (this.settingsContainer) {
        const overlay = this.settingsContainer.getAt(0);
        if (overlay) {
            overlay.setSize(width, height);
        }

        // Re-center container contents? No, container is at 0,0.
        // I need to move the panel and sliders.
        // It's easier to destroy and recreate the panel on resize, or carefully update positions.
        // Given the complexity, let's just destroy and recreate the panel if it's open, or just update positions.

        // Let's just update the panel position (index 1)
        const panel = this.settingsContainer.getAt(1);
        if (panel) {
            panel.setPosition(width / 2, height / 2);
        }

        // Title (index 2)
        const title = this.settingsContainer.getAt(2);
        const panelY = (height - 500) / 2;
        if (title) {
            title.setPosition(width / 2, panelY + 50);
        }

        // Close Btn (index 3)
        const closeBtn = this.settingsContainer.getAt(3);
        const panelX = (width - 500) / 2;
        if (closeBtn) {
            closeBtn.setPosition(panelX + 500 - 50, panelY + 50);
        }

        // Sliders are groups of objects. This is getting messy to update individually.
        // It might be better to just clear the container and recreate the panel content.

        const isVisible = this.settingsContainer.visible;
        this.settingsContainer.removeAll(true);
        this.createSettingsPanelContent(width, height);
        this.settingsContainer.setVisible(isVisible);
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

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const tx = x + Math.cos(angle) * (radius + 4);
        const ty = y + Math.sin(angle) * (radius + 4);
        graphics.fillCircle(tx, ty, 5);
    }
    graphics.fillCircle(x, y, radius);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(x, y, 6);
  }

  createSettingsPanel() {
    this.settingsContainer = this.add.container(0, 0).setVisible(false).setDepth(100);
    this.createSettingsPanelContent(this.cameras.main.width, this.cameras.main.height);
  }

  createSettingsPanelContent(screenWidth, screenHeight) {
    const width = 500;
    const height = 500;
    const x = (screenWidth - width) / 2;
    const y = (screenHeight - height) / 2;

    // Overlay
    const overlay = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7)
        .setOrigin(0)
        .setInteractive();
    this.settingsContainer.add(overlay);

    // Panel
    const panel = this.add.rectangle(screenWidth / 2, screenHeight / 2, width, height, 0x333333)
        .setStrokeStyle(4, 0xffffff);
    this.settingsContainer.add(panel);

    // Title
    const title = this.add.text(screenWidth / 2, y + 50, 'Audio Settings', {
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
    this.createSlider('Music', y + 150, screenWidth / 2, 'music');
    this.createSlider('Ambient', y + 250, screenWidth / 2, 'ambient');
    this.createSlider('SFX', y + 350, screenWidth / 2, 'sfx');
  }

  createSlider(label, y, centerX, type) {
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
    // Add loading text
    const loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Loading... 0%', {
      font: '20px monospace',
      fill: '#ffffff'
    }).setOrigin(0.5, 0.5);

    this.load.on('progress', (value) => {
      loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.destroy();
    });

    this.load.json('symbols', 'assets/symbols.json');
    this.load.json('map_sections', 'assets/map/map_sections.json'); // NEW: Preload map_sections.json
    // Replace title-page image with intro video
    this.load.video('intro-video', 'assets/intro-video.mp4');
    this.load.image('finger-cursor', 'assets/cursor/pointer-finger-pointer.png');

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

    // Preload common UI and game assets here to avoid reloading in scenes
    this.load.image('magnifying-glass', 'assets/cursor/magnifying-glass.png');
    this.load.image('egg-zit-button', 'assets/objects/egg-zit-button.png');
    this.load.image('eggs-ammin-haul', 'assets/objects/eggs-ammin-haul.png');
    this.load.image('score', 'assets/objects/score.png');
    this.load.image('egg-zam-room', 'assets/map/egg-zam-room.png');
    this.load.image('egg-zamminer', 'assets/objects/egg-zamminer.png');
    this.load.image('symbol-result-summary-diag', 'assets/objects/symbol-result-summary-diag.png');

    // Preload all 60 eggs
    for (let i = 1; i <= TOTAL_EGGS; i++) {
      this.load.image(`egg-${i}`, `assets/eggs/egg-${i}.png`);
    }

    this.load.on('filecomplete-json-symbols', (key, type, data) => {
      // console.log(`MainMenu: filecomplete-json-symbols: Key='${key}', Type='${type}'`);
      if (data && data.symbols) {
        const symbolBasePath = ''; // symbols.json paths are relative to assets/
        data.symbols.forEach(symbol => {
          if (symbol.filename) {
            // Check if texture already exists to avoid warnings/errors
            if (!this.textures.exists(symbol.filename)) {
              this.load.image(symbol.filename, symbolBasePath + symbol.filename);
            }
          }
        });
        // console.log(`MainMenu: Queued ${data.symbols.length} symbol images for loading.`);
      }
    });

    this.load.on('filecomplete-json-map_sections', (key, type, data) => {
      // console.log(`MainMenu: filecomplete-json-map_sections: Key='${key}', Type='${type}'`);
      // console.log('MainMenu: Raw loaded map_sections data:', data);
    });
    this.load.on('loaderror', (file) => {
      console.error(`MainMenu: Load error: Key='${file.key}', URL='${file.url}'`);
    });
  }

  create() {
    this.input.setDefaultCursor('none');

    // Get scale factors based on game dimensions
    const scaleX = this.game.config.width / 1280;
    const scaleY = this.game.config.height / 720;
    const scale = Math.min(scaleX, scaleY);
    this.scale = scale;

    // NEW: Initialize all game variables
    // console.log('MainMenu: Initializing game state');
    this.registry.set('foundEggs', []);
    this.registry.set('correctCategorizations', 0);
    this.registry.set('currentScore', 0);
    this.registry.set('highScore', parseInt(localStorage.getItem('highScore')) || 0);
    // console.log('MainMenu: highScore:', this.registry.get('highScore'));

    // Load and validate symbols and map sections
    const symbolsData = this.cache.json.get('symbols');
    const mapSections = this.cache.json.get('map_sections');
    if (!symbolsData || !symbolsData.symbols || !Array.isArray(symbolsData.symbols)) {
      console.error('MainMenu: Invalid symbols data:', symbolsData);
      return;
    }
    if (symbolsData.symbols.length !== TOTAL_EGGS) {
      console.error(`MainMenu: Expected ${TOTAL_EGGS} symbols, found ${symbolsData.symbols.length}`);
    }
    if (!mapSections || mapSections.length !== 11) {
      console.warn(`MainMenu: Expected 11 sections, found ${mapSections.length || 0}`);
    }
    this.registry.set('symbols', symbolsData);

    // Randomly assign 3-8 eggs per section, totaling TOTAL_EGGS
    const eggCounts = [];
    let remainingEggs = TOTAL_EGGS;
    const numSections = mapSections.length;
    for (let i = 0; i < numSections - 1; i++) {
      const maxPossible = remainingEggs - ((numSections - 1 - i) * 3);
      const minPossible = remainingEggs - ((numSections - 1 - i) * 8);

      const maxEggs = Math.min(8, maxPossible);
      const minEggs = Math.max(3, minPossible);

      const count = Phaser.Math.Between(minEggs, maxEggs);
      eggCounts.push(count);
      remainingEggs -= count;
    }
    eggCounts.push(remainingEggs);

    // console.log('MainMenu: Egg distribution:', eggCounts);

    // Shuffle egg IDs and symbols
    const eggs = Phaser.Utils.Array.Shuffle(Array.from({ length: TOTAL_EGGS }, (_, i) => i + 1));
    const shuffledSymbols = Phaser.Utils.Array.Shuffle([...symbolsData.symbols]);

    // Create eggData and sections
    const eggData = [];
    let eggIndex = 0;
    const sections = mapSections.map((section, index) => {
      const sectionEggs = eggs.slice(eggIndex, eggIndex + eggCounts[index]);
      eggIndex += eggCounts[index];
      sectionEggs.forEach((eggId, idx) => {
        const x = Phaser.Math.Between(200 * scale, (this.game.config.width / scale) - 10 * scale);
        const y = Phaser.Math.Between(50 * scale, (this.game.config.height / scale) - 10 * scale);
        eggData.push({
          eggId: eggId,
          section: section.name,
          x: x,
          y: y,
          symbol: shuffledSymbols[eggId - 1] || null,
          collected: false
        });
      });
      return { name: section.name, eggs: sectionEggs };
    });

    this.registry.set('eggData', eggData);
    this.registry.set('sections', sections);
    // console.log('MainMenu: Initialized eggData:', eggData);

    // Debug: Log game dimensions and scale
    // console.log(`MainMenu: Game dimensions - width: ${this.game.config.width}, height: ${this.game.config.height}, scale: ${scale}`);

    // Set camera bounds to match viewport
    this.cameras.main.setBounds(0, 0, this.game.config.width, this.game.config.height);
    this.cameras.main.setViewport(0, 0, this.game.config.width, this.game.config.height);
    this.cameras.main.setPosition(0, 0);

    // Debug: Log camera position
    // console.log(`MainMenu: Camera position - x: ${this.cameras.main.scrollX}, y: ${this.cameras.main.scrollY}`);

    // Background Video - position at top-left
    // Assuming video has baked-in audio that should loop
    const musicVol = this.registry.get('musicVolume') || 0.5;
    this.introVideo = this.add.video(this.game.config.width / 2, this.game.config.height / 2, 'intro-video');
    this.introVideo.setDisplaySize(this.game.config.width, this.game.config.height);
    this.introVideo.setVolume(musicVol);
    this.introVideo.play(true); // true = loop
    this.introVideo.setPaused(false);

    // Adjust text positions to be within the visible area
    this.add.text(640 * scale, 0, `He Is Risen!`, {
      fontSize: `${126 * scale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 20 * scale
    });

    this.add.text(0, 522 * scale, `Hunt with P.A.L.`, {
      fontSize: `${62 * scale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * scale
    });

    this.add.text(0, 580 * scale, `for the Meaning of Easter`, {
      fontSize: `${62 * scale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * scale
    });

    // Only show cursor on desktop
    if (!this.sys.game.device.os.desktop) {
      this.fingerCursor = null;
    } else {
      this.fingerCursor = this.add.image(0, 0, 'finger-cursor')
        .setOrigin(0.5, 0.5)
        .setDisplaySize(50 * scale, 75 * scale);
    }

    // Handle both mouse and touch input, request fullscreen on first click
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
      this.sound.play('drive1', { volume: 0.5 });

      const canvas = this.game.canvas;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const safeRequestFullscreen = (element) => {
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(err => {}); // console.log('Fullscreen failed:', err));
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen().catch(err => {}); // console.log('Fullscreen failed:', err));
        }
      };

      if (isMobile) {
        safeRequestFullscreen(canvas);
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(err => {
            // console.log('Orientation lock failed:', err);
          });
        }
      } else {
        safeRequestFullscreen(canvas);
      }
      this.scene.start('MapScene');
    };

    // NEW: Add blinking "Tap to Start" text for UX guidance
    const startText = this.add.text(this.game.config.width / 2, 650 * scale, 'Tap to Start', {
      fontSize: `${48 * scale}px`,
      fill: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#000000',
      strokeThickness: 6 * scale
    }).setOrigin(0.5)
      .setInteractive()
      .once('pointerdown', startGame);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 1000,
      ease: 'Power1',
      yoyo: true,
      repeat: -1
    });

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

    this.input.keyboard.once('keydown-SPACE', startGame);
    this.input.keyboard.once('keydown-ENTER', startGame);

    // NEW: Optional "Reset Game" button
    /*
    this.add.text(0, 650 * scale, `Reset Game`, {
      fontSize: `${32 * scale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 4 * scale
    })
      .setInteractive()
      .on('pointerdown', () => {
        this.registry.set('foundEggs', []);
        this.registry.set('correctCategorizations', 0);
        this.registry.set('currentScore', 0);
        this.registry.set('eggData', null);
        this.registry.set('sections', null);
        console.log('MainMenu: Game reset by user');
        this.scene.start('MainMenu');
      });
    */
  }

  update() {
    if (this.fingerCursor) {
      this.fingerCursor.setPosition(this.input.x, this.input.y);
    }
  }
}

class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  preload() {
    this.load.image('yellowstone-main-map', 'assets/map/yellowstone-main-map.png');
    // Common assets like 'finger-cursor', 'eggs-ammin-haul', 'score' are preloaded in MainMenu
  }

  create() {
    this.input.setDefaultCursor('none');

    // Get scale factors relative to the viewport
    const scaleX = this.game.config.width / 1280;
    const scaleY = this.game.config.height / 720;
    const scale = Math.min(scaleX, scaleY);
    this.scale = scale;

    // Set camera bounds to match viewport
    this.cameras.main.setBounds(0, 0, this.game.config.width, this.game.config.height);
    this.cameras.main.setViewport(0, 0, this.game.config.width, this.game.config.height);
    this.cameras.main.setPosition(0, 0);

    // NEW: Retrieve existing eggData and sections from registry
    const eggData = this.registry.get('eggData');
    const sections = this.registry.get('sections');
    const mapSections = this.cache.json.get('map_sections') || [];
    if (!eggData || !sections) {
      console.error('MapScene: eggData or sections missing from registry');
      this.scene.start('MainMenu'); // Fallback to MainMenu
      return;
    }
    // console.log('MapScene: Using existing eggData:', eggData);

    if (!this.scene.get('MusicScene').scene.isActive()) {
      this.scene.launch('MusicScene');
    }
    this.sound.play('drive2', { volume: 0.5 });

    // Add map image, fill the viewport
    this.mapImage = this.add.image(0, 0, 'yellowstone-main-map')
      .setOrigin(0, 0)
      .setDisplaySize(this.game.config.width, this.game.config.height);
    // console.log(`Map display size: ${this.mapImage.displayWidth}x${this.mapImage.displayHeight}, Position: (${this.mapImage.x}, ${this.mapImage.y})`);

    // Adjust interactive zones for map sections
    mapSections.forEach(section => {
      const zoneX = (section.coords.x / 1280) * this.game.config.width;
      const zoneY = (section.coords.y / 720) * this.game.config.height;
      const zoneWidth = (section.coords.width / 1280) * this.game.config.width;
      const zoneHeight = (section.coords.height / 720) * this.game.config.height;
      const zone = this.add.zone(zoneX, zoneY, zoneWidth, zoneHeight).setOrigin(0, 0);
      zone.setInteractive();
      zone.on('pointerdown', () => {
        // console.log(`Clicked ${section.name} at (${zoneX}, ${zoneY})`);
        this.sound.play('drive1', { volume: 0.5 });
        this.scene.start('SectionHunt', { sectionName: section.name });
      });
      section.zone = zone;
    });
    this.mapSections = mapSections;

    // UI elements
    this.eggsAmminHaul = this.add.image(0, 200 * scale, 'eggs-ammin-haul')
      .setOrigin(0, 0)
      .setDisplaySize(137 * scale, 150 * scale)
      .setInteractive();

    addButtonInteraction(this, this.eggsAmminHaul, 'menu-click');

    // Delayed transition
    this.eggsAmminHaul.on('pointerdown', () => {
        this.time.delayedCall(100, () => {
             this.scene.start('EggZamRoom');
        });
    });

    this.scoreImage = this.add.image(0, 0, 'score')
      .setOrigin(0, 0)
      .setDisplaySize(200 * scale, 200 * scale);

    const foundEggs = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(50 * scale, 98 * scale, `${foundEggs}/${TOTAL_EGGS}`, {
      fontSize: `${42 * scale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * scale
    });

    // Cursor for desktop only
    if (!this.sys.game.device.os.desktop) {
      this.fingerCursor = null;
    } else {
      this.fingerCursor = this.add.image(0, 0, 'finger-cursor')
        .setOrigin(0.5, 0.5)
        .setDisplaySize(50 * scale, 75 * scale);
    }
  }

  update() {
    if (this.fingerCursor) {
      this.fingerCursor.setPosition(this.input.x, this.input.y);
    }
  }
}

class SectionHunt extends Phaser.Scene {
  constructor() {
    super({ key: 'SectionHunt' });
  }

  init(data) {
    this.sectionName = data.sectionName;
  }

  preload() {
    this.load.svg(this.sectionName, `assets/map/sections/${this.sectionName}.svg`);
    // Removed redundant loading of eggs, symbols, and UI elements.
    // They are now loaded in MainMenu.

    this.load.on('loaderror', (file) => {
      if (file.type === 'image') {
        console.error(`PRELOAD ERROR: Failed to load image: Key='${file.key}', URL='${file.url}'`);
      }
    });
  }

  collectEgg(egg) {
    const foundEggs = this.registry.get('foundEggs');
    const eggDataArray = this.registry.get('eggData');
    const eggData = eggDataArray.find(e => e.eggId === egg.getData('eggId'));
    const eggInfo = {
      eggId: egg.getData('eggId'),
      symbolData: egg.getData('symbolDetails'),
      categorized: false
    };
    // console.log('SectionHunt: Collecting egg with symbolData:', eggInfo.symbolData);
    if (!foundEggs.some(e => e.eggId === eggInfo.eggId)) {
      this.sound.play('collect');
      foundEggs.push(eggInfo);
      this.registry.set('foundEggs', foundEggs);
      if (eggData) {
        eggData.collected = true;
        this.registry.set('eggData', eggDataArray);
      }
      let currentScore = this.registry.get('currentScore');
      currentScore += 10;
      if (foundEggs.length === TOTAL_EGGS) {
        currentScore += 100;
      }
      this.registry.set('currentScore', currentScore);
      const highScore = this.registry.get('highScore');
      if (currentScore > highScore) {
        this.registry.set('highScore', currentScore);
        localStorage.setItem('highScore', currentScore);
      }
      // console.log(`SectionHunt: Collected egg-${eggInfo.eggId} with symbol:`, eggInfo.symbolData ? eggInfo.symbolData.name : 'none', `Score: ${currentScore}`);
      const foundEggsCount = foundEggs.length;
      if (this.scoreText) {
        this.scoreText.setText(`${foundEggsCount}/${TOTAL_EGGS}`);
      }
    } else {
      // console.log(`SectionHunt: Egg-${eggInfo.eggId} already collected, skipping`);
    }
  }

  create() {
    this.input.setDefaultCursor('none');

    const scaleX = this.game.config.width / 1280;
    const scaleY = this.game.config.height / 720;
    const scale = Math.min(scaleX, scaleY);
    this.scale = scale;

    this.cameras.main.setBounds(0, 0, this.game.config.width, this.game.config.height);
    this.cameras.main.setViewport(0, 0, this.game.config.width, this.game.config.height);
    this.cameras.main.setPosition(0, 0);

    this.sectionImage = this.add.image(0, 0, this.sectionName)
      .setOrigin(0, 0)
      .setDisplaySize(this.game.config.width, this.game.config.height)
      .setDepth(0);

    const eggData = this.registry.get('eggData') || [];
    const sectionEggs = eggData.filter(e => e.section === this.sectionName && !e.collected);
    this.eggs = this.add.group();
    // console.log(`SectionHunt: Creating ${sectionEggs.length} uncollected eggs for ${this.sectionName}`);

    sectionEggs.forEach(eggData => {
      const egg = this.add.image(eggData.x, eggData.y, `egg-${eggData.eggId}`)
        .setInteractive()
        .setDepth(5)
        .setDisplaySize(50 * scale, 75 * scale)
        .setAlpha(0);
      egg.setData('eggId', eggData.eggId);
      egg.setData('symbolDetails', eggData.symbol);
      if (eggData.symbol && eggData.symbol.filename) {
        const textureKey = eggData.symbol.filename;
        if (this.textures.exists(textureKey)) {
          const symbolSprite = this.add.image(eggData.x, eggData.y, textureKey)
            .setDepth(6)
            .setDisplaySize(50 * scale, 75 * scale)
            .setAlpha(0);
          egg.symbolSprite = symbolSprite;
          // console.log(`SectionHunt: Added symbol '${eggData.symbol.name}' (${textureKey}) to egg-${eggData.eggId}`);
        } else {
          console.warn(`SectionHunt: Texture '${textureKey}' not found for symbol '${eggData.symbol.name}'`);
          egg.symbolSprite = null;
        }
      } else {
        // console.log(`SectionHunt: No symbol for egg-${eggData.eggId}`);
        egg.symbolSprite = null;
      }
      egg.on('pointerdown', () => {
        // console.log(`SectionHunt: Click on egg-${eggData.eggId} at (${egg.x}, ${egg.y})`);
        const pointer = this.input.activePointer;
        if (egg.getBounds().contains(pointer.worldX, pointer.worldY)) {
          // console.log(`SectionHunt: Bounds check PASSED for egg-${eggData.eggId}`);
          const distance = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, egg.x, egg.y);
          if (distance < 150 * scale) {
            // console.log(`SectionHunt: Distance check PASSED for egg-${eggData.eggId}, collecting!`);
            this.collectEgg(egg);
            egg.destroy();
            if (egg.symbolSprite) {
              egg.symbolSprite.destroy();
            }
          } else {
            // console.log(`SectionHunt: Distance check FAILED for egg-${eggData.eggId}. Dist: ${distance}`);
          }
        } else {
          // console.log(`SectionHunt: Bounds check FAILED for egg-${eggData.eggId}`);
        }
      });
      this.eggs.add(egg);
    });

    this.eggZitButton = this.add.image(0, 200 * scale, 'egg-zit-button')
      .setOrigin(0, 0)
      .setDisplaySize(150 * scale, 150 * scale)
      .setInteractive()
      .on('pointerdown', () => {
        // console.log('Click on eggZitButton');
        this.scene.start('MapScene');
      })
      .setDepth(4)
      .setScrollFactor(0);
    addButtonInteraction(this, this.eggZitButton, 'drive1');

    this.eggsAmminHaul = this.add.image(0, 350 * scale, 'eggs-ammin-haul')
      .setOrigin(0, 0)
      .setDisplaySize(137 * scale, 150 * scale)
      .setInteractive();

    addButtonInteraction(this, this.eggsAmminHaul, 'menu-click');

    // Delayed transition
    this.eggsAmminHaul.on('pointerdown', () => {
        // console.log('Click on eggsAmminHaul');
        this.time.delayedCall(100, () => {
             this.scene.start('EggZamRoom');
        });
    });

    this.sound.play('drive2', { volume: 0.5 });
    this.scoreImage = this.add.image(0, 0, 'score')
      .setOrigin(0, 0)
      .setDisplaySize(200 * scale, 200 * scale)
      .setDepth(4)
      .setScrollFactor(0);

    const foundEggs = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(50 * scale, 98 * scale, `${foundEggs}/${TOTAL_EGGS}`, {
      fontSize: `${42 * scale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * scale
    }).setDepth(5);

    this.zoomedView = this.add.renderTexture(0, 0, 200 * scale, 200 * scale)
      .setDepth(2)
      .setScrollFactor(0);
    this.maskGraphics = this.add.graphics()
      .fillCircle(50 * scale, 50 * scale, 50 * scale)
      .setScrollFactor(0);
    this.zoomedView.setMask(this.maskGraphics.createGeometryMask());

    // if (!this.sys.game.device.os.desktop) {
      // WHY DO I NEED THIS??? DO NOT WANT! ===> this.magnifyingGlass = null;
    // } else {
      this.magnifyingGlass = this.add.image(0, 0, 'magnifying-glass')
        .setOrigin(-0.75, -0.35)
        .setDepth(7)
        .setScrollFactor(0);
    // }
  }

  update() {
    const pointer = this.input.activePointer;
    const scale = this.scale;

    // MODIFIED: Changed offset to look down and right
    const offset = 45 * scale;
    const rtX = pointer.x - offset + 75 * scale; // Changed from +offset -75 to -offset +75
    const rtY = pointer.y - offset + 53 * scale; // Changed from +offset -53 to -offset +53
    this.zoomedView.setPosition(rtX, rtY);
    this.maskGraphics.setPosition(rtX, rtY);

    const zoom = 2;
    const zoomedWidth = (200 * scale) / zoom;
    const zoomedHeight = (200 * scale) / zoom;

    const centerX = pointer.x - offset; // Changed from +offset to -offset
    const centerY = pointer.y - offset; // Changed from +offset to -offset
    const worldCenter = this.cameras.main.getWorldPoint(centerX, centerY);
    const scrollX = worldCenter.x - zoomedWidth / 2;
    const scrollY = worldCenter.y - zoomedHeight / 2;

    const magnifierRadius = 50 * scale;
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
    this.zoomedView.beginDraw();
    this.zoomedView.batchDraw(this.sectionImage, -scrollX, -scrollY, 1 / zoom);
    this.eggs.getChildren().forEach(egg => {
      if (egg.active && egg.visible && egg.alpha > 0) {
        this.zoomedView.batchDraw(egg, egg.x - scrollX, egg.y - scrollY, 1 / zoom);
        if (egg.symbolSprite && egg.symbolSprite.active && egg.symbolSprite.visible && egg.symbolSprite.alpha > 0) {
          this.zoomedView.batchDraw(egg.symbolSprite, egg.symbolSprite.x - scrollX, egg.symbolSprite.y - scrollY, 1 / zoom);
        }
      }
    });
    this.zoomedView.endDraw();

    if (this.magnifyingGlass) {
      this.magnifyingGlass.setDisplaySize(100 * scale, 125 * scale);
      this.magnifyingGlass.setPosition(pointer.x, pointer.y);
    }

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
    this.scale = 1;
    this.background = null;
    this.examiner = null;
    this.symbolResultDiag = null;
    this.eggZitButton = null;
    this.scoreImage = null;
    this.scoreText = null;
    this.correctText = null;
    this.leftBottleZone = null;
    this.rightBottleZone = null;
    this.fingerCursor = null;
  }

  preload() {
    // Assets are preloaded in MainMenu
    this.load.on('loaderror', (file) => {
      console.error(`EggZamRoom: Load error: Key='${file.key}', URL='${file.url}'`);
    });

    this.load.on('filecomplete', (key, type, data) => {
      // console.log(`EggZamRoom: Successfully loaded asset: Key='${key}', Type='${type}'`);
    });
  }

  create() {
    this.input.setDefaultCursor('none');
    const width = this.game.config.width;
    const height = this.game.config.height;
    const scaleX = width / 1280;
    const scaleY = height / 720;
    this.scale = Math.min(scaleX, scaleY);

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setPosition(0, 0);

    this.background = this.add.image(0, 0, 'egg-zam-room')
      .setOrigin(0, 0)
      .setDepth(0)
      .setDisplaySize(width, height);

    const tanBoxCenterX = (640 / 1280) * width;
    const examinerWidth = 400 * this.scale;
    const examinerHeight = 500 * this.scale;
    const examinerX = tanBoxCenterX - (examinerWidth / 2);
    const floorY = (740 / 720) * height;
    const examinerY = floorY - examinerHeight;
    this.examiner = this.add.image(examinerX, examinerY, 'egg-zamminer')
      .setOrigin(0, 0)
      .setDepth(2)
      .setDisplaySize(examinerWidth, examinerHeight);

    const diagX = 0.55 * width;
    const diagY = 0.05 * height;
    this.symbolResultDiag = this.add.image(diagX, diagY, 'symbol-result-summary-diag')
      .setOrigin(0, 0)
      .setDepth(1)
      .setDisplaySize(900 * this.scale, 600 * this.scale)
      .setAlpha(0);

    this.eggZitButton = this.add.image(0, 200 * this.scale, 'egg-zit-button')
      .setOrigin(0, 0)
      .setDisplaySize(150 * this.scale, 131 * this.scale)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MapScene'))
      .setDepth(4)
      .setScrollFactor(0);
    addButtonInteraction(this, this.eggZitButton, 'drive1');

    this.scoreImage = this.add.image(0, 0, 'score')
      .setOrigin(0, 0)
      .setDisplaySize(200 * this.scale, 200 * this.scale)
      .setDepth(4)
      .setScrollFactor(0);
    const foundEggsCount = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(50 * this.scale, 98 * this.scale, `${foundEggsCount}/${TOTAL_EGGS}`, {
      fontSize: `${42 * this.scale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * this.scale
    }).setDepth(5);

    if (!this.registry.has('correctCategorizations')) {
      this.registry.set('correctCategorizations', 0);
    }
    this.correctText = this.add.text(15 * this.scale, 148 * this.scale, `Correct: ${this.registry.get('correctCategorizations')}`, {
      fontSize: `${32 * this.scale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * this.scale
    }).setDepth(5);

    const zoneWidth = 200 * this.scale;
    const zoneHeight = 400 * this.scale;
    const zoneY = examinerY + 100 * this.scale;

    this.leftBottleZone = this.add.zone(examinerX, zoneY, zoneWidth, zoneHeight)
      .setOrigin(0, 0)
      .setInteractive();

    this.rightBottleZone = this.add.zone(examinerX + zoneWidth, zoneY, zoneWidth, zoneHeight)
      .setOrigin(0, 0)
      .setInteractive();

    this.leftBottleZone.on('pointerdown', () => {
      if (this.currentEgg && !this.currentEgg.categorized) {
        const isChristian = this.currentEgg.symbolData.category === 'Christian';
        if (isChristian) {
          this.sound.play('success');
          const correctCount = this.registry.get('correctCategorizations') + 1;
          this.registry.set('correctCategorizations', correctCount);
          this.correctText.setText(`Correct: ${correctCount}`);
          let currentScore = this.registry.get('currentScore');
          currentScore += 5;
          this.registry.set('currentScore', currentScore);
          const highScore = this.registry.get('highScore');
          if (currentScore > highScore) {
            this.registry.set('highScore', currentScore);
            localStorage.setItem('highScore', currentScore);
          }
          // console.log(`EggZamRoom: Correct Christian classification, Score: ${currentScore}`);
          this.currentEgg.categorized = true;
          this.displayRandomEggInfo();
        } else {
          this.sound.play('error');
          const wrongText = this.add.text(700 * this.scale, 220 * this.scale, "Try again!", {
            fontSize: `${28 * this.scale}px`,
            fill: '#f00',
            fontStyle: 'bold',
            fontFamily: 'Comic Sans MS',
            stroke: '#fff',
            strokeThickness: 3 * this.scale
          }).setOrigin(0, 0).setDepth(4).setScrollFactor(0);
          this.time.delayedCall(1000, () => wrongText.destroy(), [], this);
        }
      }
    });

    this.rightBottleZone.on('pointerdown', () => {
      if (this.currentEgg && !this.currentEgg.categorized) {
        const isPagan = this.currentEgg.symbolData.category === 'Pagan';
        if (isPagan) {
          this.sound.play('success');
          const correctCount = this.registry.get('correctCategorizations') + 1;
          this.registry.set('correctCategorizations', correctCount);
          this.correctText.setText(`Correct: ${correctCount}`);
          let currentScore = this.registry.get('currentScore');
          currentScore += 5;
          this.registry.set('currentScore', currentScore);
          const highScore = this.registry.get('highScore');
          if (currentScore > highScore) {
            this.registry.set('highScore', currentScore);
            localStorage.setItem('highScore', currentScore);
          }
          // console.log(`EggZamRoom: Correct Pagan classification, Score: ${currentScore}`);
          this.currentEgg.categorized = true;
          this.displayRandomEggInfo();
        } else {
          this.sound.play('error');
          const wrongText = this.add.text(700 * this.scale, 220 * this.scale, "Try again!", {
            fontSize: `${28 * this.scale}px`,
            fill: '#f00',
            fontStyle: 'bold',
            fontFamily: 'Comic Sans MS',
            stroke: '#fff',
            strokeThickness: 3 * this.scale
          }).setOrigin(0, 0).setDepth(4).setScrollFactor(0);
          this.time.delayedCall(1000, () => wrongText.destroy(), [], this);
        }
      }
    });

    this.displayRandomEggInfo();

    if (!this.sys.game.device.os.desktop) {
      this.fingerCursor = null;
    } else {
      this.fingerCursor = this.add.image(0, 0, 'finger-cursor')
        .setOrigin(0.5, 0.5)
        .setDisplaySize(50 * this.scale, 75 * this.scale)
        .setDepth(7);
    }
  }

  displayRandomEggInfo() {
    const foundEggs = this.registry.get('foundEggs');
    const width = this.game.config.width;
    const height = this.game.config.height;

    if (this.currentEgg === null || this.currentEgg.categorized) {
      const uncategorizedEggs = foundEggs.filter(egg => !egg.categorized);
      if (uncategorizedEggs.length > 0) {
        this.currentEgg = Phaser.Utils.Array.GetRandom(uncategorizedEggs);
      } else {
        this.currentEgg = null;
        if (this.noEggsText) this.noEggsText.destroy();
        this.noEggsText = this.add.text((0.36 * width), (0.25 * height), "  All eggs have been categorized!", {
          fontSize: `${28 * this.scale}px`,
          fill: '#000',
          fontStyle: 'bold',
          fontFamily: 'Comic Sans MS',
          stroke: '#fff',
          strokeThickness: 3 * this.scale,
          wordWrap: { width: 480 * this.scale, useAdvancedWrap: true }
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
      const windowCenterX = 196 * this.scale;
      const windowBottomY = 190 * this.scale;
      const eggHeight = 125 * this.scale;
      const symbolHeight = 125 * this.scale;

      const eggPosX = this.examiner.x + windowCenterX;
      const eggPosY = this.examiner.y + windowBottomY - (eggHeight / 2);
      const symbolPosX = this.examiner.x + windowCenterX;
      const symbolPosY = this.examiner.y + windowBottomY - (symbolHeight / 2);

      if (this.textures.exists(`egg-${eggId}`)) {
        this.displayedEggImage = this.add.image(eggPosX, eggPosY, `egg-${eggId}`)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(100 * this.scale, 125 * this.scale)
          .setDepth(3);
      }
      if (symbolData && symbolData.filename && this.textures.exists(symbolData.filename)) {
        this.displayedSymbolImage = this.add.image(symbolPosX, symbolPosY, symbolData.filename)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(100 * this.scale, 125 * this.scale)
          .setDepth(3);
      }
    }
  }

  update() {
    const foundEggsCount = this.registry.get('foundEggs').length;
    if (this.scoreText) {
      this.scoreText.setText(`${foundEggsCount}/${TOTAL_EGGS}`);
    }
    if (this.fingerCursor) {
      this.fingerCursor.setPosition(this.input.x, this.input.y);
    }
  }
}

function getViewportDimensions() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  let width, height;
  if (isMobile) {
    width = screen.width;
    height = screen.height;
    if (width < height) {
      [width, height] = [height, width];
    }
  } else {
    width = window.innerWidth;
    height = document.documentElement.clientHeight;
  }
  return { width, height };
}

const { width, height } = getViewportDimensions();
const config = {
  type: Phaser.AUTO,
  width: width,
  height: height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container',
  },
  scene: [MainMenu, MapScene, SectionHunt, EggZamRoom, MusicScene, UIScene],
  backgroundColor: '#000000',
};

const game = new Phaser.Game(config);

/**
 * Adds a "press" animation to a game object on touch.
 * @param {Phaser.Scene} scene - The scene the object belongs to.
 * @param {Phaser.GameObjects.GameObject} button - The game object to animate.
 * @param {string} [soundKey='success'] - The key of the sound to play on click.
 */
function addButtonInteraction(scene, button, soundKey = 'success') {
  let baseScaleX, baseScaleY;

  button.on('pointerdown', () => {
    // Try to play sound via MusicScene if available to ensure persistence
    const musicScene = scene.scene.get('MusicScene');
    if (musicScene && musicScene.scene.isActive()) {
        musicScene.playSFX(soundKey);
    } else if (soundKey && scene.sound.get(soundKey)) {
        scene.sound.play(soundKey, { volume: 0.5 });
    }

    if (!scene.tweens.isTweening(button)) {
      baseScaleX = button.scaleX;
      baseScaleY = button.scaleY;
    }

    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scaleX: (baseScaleX || button.scaleX) * 0.9,
      scaleY: (baseScaleY || button.scaleY) * 0.9,
      duration: 50,
      ease: 'Power1'
    });
  });

  const restore = () => {
    if (baseScaleX !== undefined) {
      scene.tweens.killTweensOf(button);
      scene.tweens.add({
        targets: button,
        scaleX: baseScaleX,
        scaleY: baseScaleY,
        duration: 100,
        ease: 'Power1'
      });
    }
  };

  button.on('pointerup', restore);
  button.on('pointerout', restore);
}

function resizeGame() {
  const { width, height } = getViewportDimensions();
  game.scale.resize(width, height);
  const canvas = game.canvas;
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  const scaleX = width / 1280;
  const scaleY = height / 720;
  const scale = Math.min(scaleX, scaleY);

  game.scene.getScenes(true).forEach(scene => {
    if (scene.scale) scene.scale = scale;
    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.setBounds(0, 0, width, height);
      scene.cameras.main.setViewport(0, 0, width, height);
      scene.cameras.main.setPosition(0, 0);
    }
    if (scene.scene.key === 'MainMenu') {
      if (scene.introVideo) {
        scene.introVideo.setPosition(width / 2, height / 2);
        scene.introVideo.setDisplaySize(width, height);
      }
    }
    if (scene.scene.key === 'MapScene') {
      if (scene.mapImage) {
        scene.mapImage.setDisplaySize(width, height);
      }
      if (scene.mapSections) {
        scene.mapSections.forEach(section => {
          if (section.zone) {
            const zoneX = (section.coords.x / 1280) * width;
            const zoneY = (section.coords.y / 720) * height;
            const zoneWidth = (section.coords.width / 1280) * width;
            const zoneHeight = (section.coords.height / 720) * height;
            section.zone.setPosition(zoneX, zoneY);
            section.zone.setSize(zoneWidth, zoneHeight);
          }
        });
      }
      if (scene.eggsAmminHaul) {
        scene.eggsAmminHaul.setPosition(0, 200 * scale);
        scene.eggsAmminHaul.setDisplaySize(137 * scale, 150 * scale);
      }
      if (scene.scoreImage) {
        scene.scoreImage.setDisplaySize(200 * scale, 200 * scale);
      }
      if (scene.scoreText) {
        scene.scoreText.setPosition(50 * scale, 98 * scale);
        scene.scoreText.setStyle({
          fontSize: `${42 * scale}px`,
          strokeThickness: 6 * scale
        });
        const foundEggsCount = scene.registry.get('foundEggs').length;
        scene.scoreText.setText(`${foundEggsCount}/${TOTAL_EGGS}`);
      }
      if (scene.fingerCursor) {
        scene.fingerCursor.setDisplaySize(50 * scale, 75 * scale);
      }
    }
    if (scene.scene.key === 'SectionHunt') {
      if (scene.sectionImage) {
        scene.sectionImage.setDisplaySize(width, height);
      }
      if (scene.eggs) {
        scene.eggs.getChildren().forEach(egg => {
          if (egg && egg.active) {
            egg.setDisplaySize(50 * scale, 75 * scale);
            if (egg.symbolSprite) {
              egg.symbolSprite.setDisplaySize(50 * scale, 75 * scale);
            }
          }
        });
      }
      if (scene.eggZitButton) {
        scene.eggZitButton.setPosition(0, 200 * scale);
        scene.eggZitButton.setDisplaySize(150 * scale, 150 * scale);
      }
      if (scene.eggsAmminHaul) {
        scene.eggsAmminHaul.setPosition(0, 350 * scale);
        scene.eggsAmminHaul.setDisplaySize(137 * scale, 150 * scale);
      }
      if (scene.scoreImage) {
        scene.scoreImage.setDisplaySize(200 * scale, 200 * scale);
      }
      if (scene.scoreText) {
        scene.scoreText.setPosition(50 * scale, 98 * scale);
        scene.scoreText.setStyle({
          fontSize: `${42 * scale}px`,
          strokeThickness: 6 * scale
        });
        const foundEggsCount = scene.registry.get('foundEggs').length;
        scene.scoreText.setText(`${foundEggsCount}/${TOTAL_EGGS}`);
      }
      if (scene.zoomedView) {
        scene.zoomedView.setPosition(0, 0);
        scene.zoomedView.setSize(200 * scale, 200 * scale);
      }
      if (scene.maskGraphics) {
        scene.maskGraphics.clear();
        scene.maskGraphics.fillCircle(50 * scale, 50 * scale, 50 * scale);
      }
      if (scene.magnifyingGlass) {
        scene.magnifyingGlass.setDisplaySize(100 * scale, 125 * scale);
        scene.magnifyingGlass.setPosition(scene.input.x, scene.input.y);
      }
    }
    if (scene.scene.key === 'UIScene') {
      scene.resize({ width, height });
    }
    if (scene.scene.key === 'EggZamRoom') {
      if (scene.background) scene.background.setDisplaySize(width, height);
      if (scene.examiner) {
        const tanBoxCenterX = (640 / 1280) * width;
        const examinerWidth = 400 * scale;
        const examinerHeight = 500 * scale;
        const examinerX = tanBoxCenterX - (examinerWidth / 2);
        const floorY = (740 / 720) * height;
        const examinerY = floorY - examinerHeight;
        scene.examiner.setPosition(examinerX, examinerY);
        scene.examiner.setDisplaySize(examinerWidth, examinerHeight);
      }
      if (scene.symbolResultDiag) {
        scene.symbolResultDiag.setPosition(0.55 * width, 0.05 * height);
        scene.symbolResultDiag.setDisplaySize(900 * scale, 600 * scale);
      }
      if (scene.eggZitButton) {
        scene.eggZitButton.setPosition(0, 200 * scale);
        scene.eggZitButton.setDisplaySize(150 * scale, 131 * scale);
      }
      if (scene.scoreImage) {
        scene.scoreImage.setDisplaySize(200 * scale, 200 * scale);
      }
      if (scene.scoreText) {
        const foundEggsCount = scene.registry.get('foundEggs').length;
        scene.scoreText.setText(`${foundEggsCount}/${TOTAL_EGGS}`);
        scene.scoreText.setPosition(50 * scale, 98 * scale);
        scene.scoreText.setStyle({ fontSize: `${42 * scale}px`, strokeThickness: 6 * scale });
      }
      if (scene.correctText) {
        scene.correctText.setPosition(100 * scale, 150 * scale);
        scene.correctText.setStyle({ fontSize: `${32 * scale}px`, strokeThickness: 6 * scale });
      }
      if (scene.leftBottleZone) {
        const examinerX = (640 / 1280) * width - (400 * scale / 2);
        const floorY = (740 / 720) * height;
        const examinerY = floorY - (500 * scale);
        scene.leftBottleZone.setPosition(examinerX, examinerY + (100 * scale));
        scene.leftBottleZone.setSize(200 * scale, 400 * scale);
      }
      if (scene.rightBottleZone) {
        const examinerX = (640 / 1280) * width - (400 * scale / 2);
        const floorY = (740 / 720) * height;
        const examinerY = floorY - (500 * scale);
        scene.rightBottleZone.setPosition(examinerX + (200 * scale), examinerY + (100 * scale));
        scene.rightBottleZone.setSize(200 * scale, 400 * scale);
      }
      if (scene.displayedEggImage) {
        const windowCenterX = 196 * scale;
        const windowBottomY = 190 * scale;
        const eggHeight = 125 * scale;
        scene.displayedEggImage.setPosition(scene.examiner.x + windowCenterX, scene.examiner.y + windowBottomY - (eggHeight / 2));
        scene.displayedEggImage.setDisplaySize(100 * scale, 125 * scale);
      }
      if (scene.displayedSymbolImage) {
        const windowCenterX = 196 * scale;
        const windowBottomY = 190 * scale;
        const symbolHeight = 125 * scale;
        scene.displayedSymbolImage.setPosition(scene.examiner.x + windowCenterX, scene.examiner.y + windowBottomY - (symbolHeight / 2));
        scene.displayedSymbolImage.setDisplaySize(100 * scale, 125 * scale);
      }
      if (scene.noEggsText) {
        scene.noEggsText.setPosition(0.36 * width, 0.25 * height);
        scene.noEggsText.setStyle({ fontSize: `${28 * scale}px`, strokeThickness: 3 * scale, wordWrap: { width: 480 * scale, useAdvancedWrap: true } });
      }
      if (scene.fingerCursor) scene.fingerCursor.setDisplaySize(50 * scale, 75 * scale);
    }
  });
}

game.events.on('ready', () => {
  resizeGame();
  window.addEventListener('resize', resizeGame);
  window.addEventListener('orientationchange', resizeGame);
});
