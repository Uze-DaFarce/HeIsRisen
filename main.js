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

    // Add ESC key support
    const closeSettings = () => {
        if (this.settingsContainer.visible) {
            this.settingsContainer.setVisible(false);
            this.gearIcon.setVisible(true);
            this.gearIcon.setScale(1);
            this.input.setDefaultCursor('none');
        }
    };
    this.input.keyboard.on('keydown-ESC', closeSettings);
    this.input.keyboard.on('keydown-ENTER', closeSettings);

    this.scale.on('resize', this.resize, this);
  }

  resize(gameSize) {
      const width = gameSize.width;
      const height = gameSize.height;

      if (this.gearIcon) {
          this.gearIcon.x = width - 60;
          this.gearIcon.y = 60;
      }

      if (this.settingsContainer) {
          // Re-center settings panel
          this.settingsContainer.getAll().forEach(child => {
              // Update overlay
              if (child.width === this.cameras.main.width && child.height === this.cameras.main.height) {
                  child.setSize(width, height);
              }
          });
      }
  }

  createGearIcon() {
    const x = this.cameras.main.width - 60;
    const y = 60;
    const gear = this.add.graphics({ x, y });

    gear.fillStyle(0xffffff, 1);

    // Draw gear shape - reduced size by half
    const radius = 12.5;

    gear.fillCircle(0, 0, radius);

    // Teeth - adjusted for smaller size
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const tx = Math.cos(angle) * (radius + 4);
        const ty = Math.sin(angle) * (radius + 4);
        gear.fillCircle(tx, ty, 3);
    }
    gear.fillCircle(0, 0, radius); // Redraw center to smooth

    // Inner hole
    gear.fillStyle(0x000000, 1);
    gear.fillCircle(0, 0, 5);

    const hitArea = new Phaser.Geom.Circle(0, 0, 20);
    gear.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    gear.input.cursor = 'pointer';

    gear.on('pointerover', () => this.tweens.add({
        targets: gear, scale: 1.2, duration: 100, ease: 'Sine.easeInOut'
    }));

    gear.on('pointerout', () => this.tweens.add({
        targets: gear, scale: 1, duration: 100, ease: 'Sine.easeInOut'
    }));

    addButtonInteraction(this, gear, 'menu-click');

    gear.on('pointerdown', () => {
        this.tweens.add({
            targets: gear,
            scaleX: 0.9,
            scaleY: 0.9,
            duration: 50,
            ease: 'Power1',
            onComplete: () => {
                this.time.delayedCall(50, () => {
                    this.openSettings();
                    gear.setScale(1.0); // Reset scale for next time
                });
            }
        });
    });

    this.gearIcon = gear;
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
    const closeSize = 40;
    const closeX = x + width - 30;
    const closeY = y + 30;

    const closeBtn = this.add.container(closeX, closeY);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xff4444, 1); // Reddish
    closeBg.fillCircle(0, 0, closeSize / 2);
    closeBg.lineStyle(2, 0xffffff, 1);
    closeBg.strokeCircle(0, 0, closeSize / 2);

    // Draw X
    const xSize = closeSize / 4;
    closeBg.lineStyle(3, 0xffffff, 1);
    closeBg.beginPath();
    closeBg.moveTo(-xSize, -xSize);
    closeBg.lineTo(xSize, xSize);
    closeBg.moveTo(xSize, -xSize);
    closeBg.lineTo(-xSize, xSize);
    closeBg.strokePath();

    closeBtn.add(closeBg);
    closeBtn.setSize(closeSize, closeSize);
    closeBtn.setInteractive(new Phaser.Geom.Circle(0, 0, closeSize / 2), Phaser.Geom.Circle.Contains);

    // Hover effects
    closeBtn.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
        this.tweens.add({
            targets: closeBtn,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 100,
            ease: 'Sine.easeInOut'
        });
    });

    closeBtn.on('pointerout', () => {
        this.input.setDefaultCursor('default');
        this.tweens.add({
            targets: closeBtn,
            scaleX: 1.0,
            scaleY: 1.0,
            duration: 100,
            ease: 'Sine.easeInOut'
        });
    });

    closeBtn.on('pointerdown', () => {
        this.settingsContainer.setVisible(false);
        this.gearIcon.setVisible(true);
        this.gearIcon.setScale(1);
        this.input.setDefaultCursor('none');
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

    // Invisible hit area for easier clicking on track
    const trackHitArea = this.add.rectangle(centerX, y + 10, 200, 20, 0x888888, 0).setInteractive({ cursor: 'pointer' });
    this.settingsContainer.add(trackHitArea);
    this.settingsContainer.add(this.add.rectangle(centerX, y + 10, 200, 4, 0x888888));

    // Handle
    let currentVol = 0.5;
    if (this.registry.has(`${type}Volume`)) currentVol = this.registry.get(`${type}Volume`);

    const handle = this.add.circle(startX + (currentVol * 200), y + 10, 12, 0xffffff).setInteractive({ draggable: true });
    this.settingsContainer.add(handle);

    const updateVolume = (x) => {
        const clampedX = Phaser.Math.Clamp(x, startX, endX);
        handle.x = clampedX;
        this.registry.set(`${type}Volume`, (clampedX - startX) / 200);
    };

    handle.on('drag', (p, x) => updateVolume(x));
    trackHitArea.on('pointerdown', (p) => updateVolume(p.worldX));

    handle.on('pointerover', () => { handle.setScale(1.3); this.input.setDefaultCursor('pointer'); });
    handle.on('pointerout', () => { handle.setScale(1); this.input.setDefaultCursor('default'); });
  }

  openSettings() {
    this.settingsContainer.setVisible(true);
    this.gearIcon.setVisible(false);
    this.input.setDefaultCursor('default');
  }
}

class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  preload() {
    // Bolt Optimization: Centralized asset preloading to prevent gameplay stutter
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading Bar Background
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Loading Text
    const loadingText = this.add.text(width / 2, height / 2 + 50, 'Loading... 0%', {
        fontFamily: 'Comic Sans MS',
        fontSize: '24px',
        fill: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
        // Update Text
        loadingText.setText(`Loading... ${Math.floor(value * 100)}%`);

        // Update Bar
        progressBar.clear();
        progressBar.fillStyle(0xffff00, 1);
        progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.json('symbols', 'assets/symbols.json');
    this.load.json('map_sections', 'assets/map/map_sections.json');
    this.load.video('intro-video', 'assets/video/HeIsRisen-Intro.mp4');
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
    this.load.audio('ambient1', 'assets/audio/ambient1.mp3');
    this.load.audio('menu-click', 'assets/audio/menu-click.mp3');
    this.load.audio('drive1', 'assets/audio/drive1.mp3');
    this.load.audio('drive2', 'assets/audio/drive2.mp3');

    this.load.on('filecomplete-json-map_sections', (key, type, data) => {
      // console.log(`MainMenu: filecomplete-json-map_sections: Key='${key}', Type='${type}'`);
      if (Array.isArray(data)) {
        data.forEach(section => {
             // Preload section SVGs using the same naming convention as SectionHunt
             // Fallback to SVG if video not found logic happens in SectionHunt, but we preload SVGs here
             this.load.svg(section.name, `assets/map/sections/${section.name}.svg`);

             // Preload video backgrounds
             // Try to load video if we expect it, even if missing (Phaser handles 404s gracefully usually by erroring the file load but not crashing the app if handled)
             // Use a try/catch equivalent or assume file exists if strict
             // For safety, let's load it. If it fails, we fall back to SVG in SectionHunt
             this.load.video(`${section.name}-video`, `assets/video/${section.name}.mp4`);
        });
        // console.log(`MainMenu: Queued ${data.length} section SVGs and Videos for loading.`);
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
          // Sentinel: Validate symbol path to prevent traversal/malicious loading
          if (this.isValidSymbol(symbol)) {
            this.load.image(symbol.filename, symbol.filename);
          } else {
            console.warn(`Security: Skipped invalid symbol filename: ${symbol.filename}`);
          }
        });
      }
    });

    this.load.on('complete', () => {
        progressBar.destroy();
        progressBox.destroy();
        loadingText.destroy();
    });

    this.load.on('loaderror', (file) => {
      console.error(`MainMenu: Load error: Key='${file.key}', URL='${file.url}'`);
    });
  }

  create() {
    this.input.setDefaultCursor('none');

    const width = this.scale.width;
    const height = this.scale.height;

    // Intro Video - centered
    const introVideo = this.add.video(width / 2, height / 2, 'intro-video');
    introVideo.setMute(true); // Start muted to allow autoplay
    introVideo.disableInteractive(); // Ensure video ignores input
    try {
        introVideo.play(true); // Loop
    } catch (e) {
        console.warn('Video autoplay synchronous error:', e);
    }
    this.introVideo = introVideo; // Store reference for resizing

    // Fit video to cover screen
    const scaleX = width / introVideo.width;
    const scaleY = height / introVideo.height;
    const videoScale = Math.max(scaleX, scaleY);
    introVideo.setScale(videoScale);

    // Initial Overlay Text "Tap anywhere to start"
    const tapToStartText = this.add.text(width / 2, height / 2, 'Tap anywhere to start', {
        fontSize: '48px',
        fontFamily: 'Comic Sans MS',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
    }).setOrigin(0.5).setDepth(100);
    this.tapToStartText = tapToStartText;

    // "Play Now" Button Container (Initially Hidden)
    const buttonWidth = 400;
    const buttonHeight = 100;
    const btnX = width / 2;
    const btnY = height * 0.8; // Position relative to height

    const startBtnContainer = this.add.container(btnX, btnY).setVisible(false).setDepth(101);
    this.startBtnContainer = startBtnContainer;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff0000, 1);
    btnBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
    btnBg.lineStyle(4, 0xffffff, 1);
    btnBg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 16);
    startBtnContainer.add(btnBg);

    const btnText = this.add.text(0, 0, 'PLAY NOW', {
      fontSize: `40px`,
      fill: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    startBtnContainer.add(btnText);

    startBtnContainer.setSize(buttonWidth, buttonHeight);
    startBtnContainer.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight), Phaser.Geom.Rectangle.Contains);

    this.fingerCursor = this.add.image(0, 0, 'finger-cursor').setOrigin(0, 0).setDisplaySize(50, 75).setDepth(1000);

    // Initialize volume registry
    if (!this.registry.has('musicVolume')) this.registry.set('musicVolume', 0.5);
    if (!this.registry.has('ambientVolume')) this.registry.set('ambientVolume', 0.5);
    if (!this.registry.has('sfxVolume')) this.registry.set('sfxVolume', 0.5);

    // Launch UI Scene
    if (!this.scene.get('UIScene').scene.isActive()) {
        this.scene.launch('UIScene');
    }

    // Intro Logic State
    let introState = 'waiting'; // waiting -> playing -> ready

    // 1. Waiting: Loop Muted. On Click -> Playing
    this.input.once('pointerdown', () => {
        if (introState !== 'waiting') return;
        introState = 'playing';

        tapToStartText.setVisible(false);

        // Resume Audio
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume();
        }

        // Unmute and Restart Video
        if (introVideo) {
            introVideo.setMute(false);
            const vol = this.registry.get('musicVolume');
            introVideo.setVolume(vol);
            introVideo.play(true); // Restart loop with sound
        }

        // Request Fullscreen (Desktop logic)
        if (this.scale.fullscreen.available) {
            this.scale.startFullscreen();
        }

        // Show Play Button after delay
        this.time.delayedCall(3000, () => {
            introState = 'ready';
            startBtnContainer.setVisible(true);
            startBtnContainer.setScale(0);

            this.tweens.add({
                targets: startBtnContainer,
                scaleX: 1,
                scaleY: 1,
                duration: 500,
                ease: 'Back.out',
                onComplete: () => {
                    this.tweens.add({
                        targets: startBtnContainer,
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 800,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            });
        });
    });

    // 2. Play Button Logic
    startBtnContainer.on('pointerdown', () => {
        this.tweens.add({
            targets: introVideo,
            volume: 0,
            duration: 500,
            onComplete: () => {
                if (introVideo) {
                    introVideo.stop();
                    introVideo.destroy();
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
            }
        });
    });

    // Update intro volume if changed in settings
    const updateIntroVolume = (parent, key, data) => {
        if (key === 'musicVolume' && this.introVideo && this.introVideo.active) {
            this.introVideo.setVolume(data);
        }
    };
    this.registry.events.on('changedata', updateIntroVolume);
    this.events.once('shutdown', () => {
        this.registry.events.off('changedata', updateIntroVolume);
        if (this.introVideo) {
            this.introVideo.stop();
            this.introVideo.destroy();
        }
    });

    // Handle Resize
    this.scale.on('resize', this.resize, this);

    const symbolsData = this.cache.json.get('symbols');
    if (symbolsData) {
      if (symbolsData.symbols && Array.isArray(symbolsData.symbols)) {
        const validSymbols = symbolsData.symbols.filter(s => this.isValidSymbol(s));
        this.registry.set('symbols', symbolsData);
      }
    }
  }

  resize(gameSize) {
      const width = gameSize.width;
      const height = gameSize.height;

      this.cameras.main.setViewport(0, 0, width, height);

      if (this.introVideo && this.introVideo.active) {
          this.introVideo.setPosition(width/2, height/2);
          const scaleX = width / this.introVideo.width;
          const scaleY = height / this.introVideo.height;
          const videoScale = Math.max(scaleX, scaleY);
          this.introVideo.setScale(videoScale);
      }

      if (this.tapToStartText) {
          this.tapToStartText.setPosition(width/2, height/2);
      }

      if (this.startBtnContainer) {
          this.startBtnContainer.setPosition(width/2, height * 0.8);
      }
  }

  isValidSymbol(s) {
    // Sentinel: validate structure and prevent path traversal
    return s && typeof s === 'object' &&
           typeof s.filename === 'string' &&
           !s.filename.includes('..') &&
           /^[a-zA-Z0-9_\-\/]+\.(png|jpg|jpeg)$/i.test(s.filename);
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

    // Scale logic
    const width = this.scale.width;
    const height = this.scale.height;

    // We want to fit the map 1280x720 into the screen while maintaining aspect ratio?
    // Or cover? The user requested "full screen maximized viewport".
    // For the map, "cover" makes sense to fill the screen.

    const mapSections = this.cache.json.get('map_sections');

    // Distribute eggs randomly (3-8 per section) while summing to TOTAL_EGGS
    const eggCounts = [];
    let remainingEggs = TOTAL_EGGS;
    const numSections = mapSections.length;

    for (let i = 0; i < numSections - 1; i++) {
        const maxPossible = remainingEggs - ((numSections - 1 - i) * 3);
        const minPossible = remainingEggs - ((numSections - 1 - i) * 8);
        const max = Math.min(8, maxPossible);
        const min = Math.max(3, minPossible);
        const count = Phaser.Math.Between(min, max);
        eggCounts.push(count);
        remainingEggs -= count;
    }
    eggCounts.push(remainingEggs);

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

    this.mapImage = this.add.image(width/2, height/2, 'yellowstone-main-map');
    this.updateLayout(width, height);

    // Create hover graphics for highlighting map sections
    this.hoverGraphics = this.add.graphics().setDepth(10);
    this.mapZones = [];

    mapSections.forEach(section => {
      const zone = this.add.zone(0, 0, 1, 1).setOrigin(0, 0);
      zone.name = section.name;
      zone.sectionData = section; // Store original coords
      zone.setInteractive();

      zone.on('pointerover', () => {
          this.hoverGraphics.clear();
          this.hoverGraphics.lineStyle(4, 0xffff00, 1);
          this.hoverGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
          this.hoverGraphics.fillStyle(0xffff00, 0.2);
          this.hoverGraphics.fillRect(zone.x, zone.y, zone.width, zone.height);
      });

      zone.on('pointerout', () => {
          this.hoverGraphics.clear();
      });

      zone.on('pointerdown', () => {
        this.sound.play('drive1', { volume: 0.5 });
        this.scene.start('SectionHunt', { sectionName: section.name });
      });

      this.mapZones.push(zone);
    });

    this.eggsAmminHaul = this.add.image(0, 0, 'eggs-ammin-haul').setOrigin(0, 0);
    addButtonInteraction(this, this.eggsAmminHaul, 'menu-click');
    this.eggsAmminHaul.on('pointerdown', () => {
         this.time.delayedCall(100, () => {
             this.scene.start('EggZamRoom');
         });
    });

    this.scoreImage = this.add.image(0, 0, 'score').setOrigin(0, 0);
    const foundEggs = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(0, 0, `${foundEggs}/${TOTAL_EGGS}`, { fontSize: '42px', fill: '#000', fontStyle: 'bold', fontFamily: 'Comic Sans MS', stroke: '#fff', strokeThickness: 6 });

    this.fingerCursor = this.add.image(0, 0, 'finger-cursor').setOrigin(0, 0).setDisplaySize(50, 75);

    // Initial Layout update
    this.updateLayout(width, height);

    this.scale.on('resize', this.resize, this);
  }

  resize(gameSize) {
      this.updateLayout(gameSize.width, gameSize.height);
  }

  updateLayout(width, height) {
      this.cameras.main.setViewport(0, 0, width, height);

      // Calculate scale to cover
      const scaleX = width / 1280;
      const scaleY = height / 720;
      const scale = Math.max(scaleX, scaleY);

      // Center map
      this.mapImage.setPosition(width/2, height/2);
      this.mapImage.setScale(scale);

      // Calculate offset for map centering
      const mapWidth = 1280 * scale;
      const mapHeight = 720 * scale;
      const offsetX = (width - mapWidth) / 2;
      const offsetY = (height - mapHeight) / 2;

      // Update Zones
      if (this.mapZones) {
          this.mapZones.forEach(zone => {
              const d = zone.sectionData.coords;
              zone.setPosition(offsetX + d.x * scale, offsetY + d.y * scale);
              zone.setSize(d.width * scale, d.height * scale);
          });
      }

      // UI Elements - Scale with MIN to stay on screen and proportional
      const uiScale = Math.min(scaleX, scaleY);

      if (this.eggsAmminHaul) {
          this.eggsAmminHaul.setScale(uiScale);
          this.eggsAmminHaul.setPosition(0, 200 * uiScale);
      }

      if (this.scoreImage) {
          this.scoreImage.setScale(uiScale);
          this.scoreImage.setPosition(0, 0);
      }

      if (this.scoreText) {
          this.scoreText.setScale(uiScale);
          this.scoreText.setPosition(50 * uiScale, 98 * uiScale);
      }
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
    if (!foundEggs.some(e => e.eggId === eggData.eggId)) {
      this.sound.play('collect');

      let symbolTexture = null;
      if (egg.symbolSprite && egg.symbolSprite.active) {
          symbolTexture = egg.symbolSprite.texture.key;
      }

      this.showCollectionFeedback(egg.x, egg.y, egg.texture.key, symbolTexture);
      foundEggs.push(eggData);
      this.registry.set('foundEggs', foundEggs);

      if (this.hintTimer) {
          this.hintTimer.reset({ delay: 120000, callback: this.showIdleHint, callbackScope: this, loop: true });
      }
    }
  }

  showCollectionFeedback(x, y, eggTexture, symbolTexture) {
    // Show Egg Sprite
    const eggSprite = this.add.image(x, y, eggTexture).setDepth(20).setDisplaySize(50, 75);
    this.tweens.add({
        targets: eggSprite,
        y: y - 60,
        alpha: 0,
        duration: 1000,
        ease: 'Power1',
        onComplete: () => eggSprite.destroy()
    });

    // Show Symbol Sprite if exists
    if (symbolTexture) {
        const symSprite = this.add.image(x, y, symbolTexture).setDepth(21).setDisplaySize(50, 75);
        this.tweens.add({
            targets: symSprite,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => symSprite.destroy()
        });
    }

    const feedback = this.add.text(x, y - 40, 'Found!', {
        fontSize: '32px',
        fontFamily: 'Comic Sans MS',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(22);

    this.tweens.add({
        targets: feedback,
        y: y - 100,
        alpha: 0,
        duration: 1000,
        ease: 'Power1',
        onComplete: () => feedback.destroy()
    });
  }

  showIdleHint() {
    const foundEggs = this.registry.get('foundEggs');
    const sections = this.registry.get('sections');
    const currentSection = sections.find(s => s.name === this.sectionName);

    if (!currentSection) return;

    const eggsInSection = currentSection.eggs; // Array of IDs
    const foundIds = foundEggs.map(e => e.eggId);
    const remainingCount = eggsInSection.filter(id => !foundIds.includes(id)).length;

    if (remainingCount > 0) {
        const musicScene = this.scene.get('MusicScene');
        if (musicScene) musicScene.playSFX('menu-click');

        const hintText = this.add.text(this.scale.width / 2, this.scale.height * 0.8, `Hint: ${remainingCount} eggs left here!`, {
            fontSize: '32px',
            fontFamily: 'Comic Sans MS',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 10, y: 5 },
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(30).setScrollFactor(0);

        this.tweens.add({
            targets: hintText,
            alpha: 0,
            delay: 4000,
            duration: 1000,
            onComplete: () => hintText.destroy()
        });
    }
  }

  create() {
    this.input.setDefaultCursor('none');

    // Scale logic
    const width = this.scale.width;
    const height = this.scale.height;
    const scaleX = width / 1280;
    const scaleY = height / 720;
    const scale = Math.max(scaleX, scaleY); // Cover

    this.bgScale = scale;
    this.bgOffsetX = (width - 1280 * scale) / 2;
    this.bgOffsetY = (height - 720 * scale) / 2;

    this.cameras.main.setViewport(0, 0, width, height);

    // Check if video exists in cache
    const videoKey = `${this.sectionName}-video`;

    if (this.cache.video.exists(videoKey)) {
        // Use Video Background
        this.sectionVideo = this.add.video(width/2, height/2, videoKey)
            .setDisplaySize(1280 * scale, 720 * scale)
            .setDepth(0);

        this.sectionVideo.play(true); // Loop
        this.sectionVideo.setMute(true); // Mute background videos
        this.sectionVideo.setInteractive(false); // Should not block clicks

        this.isUsingVideo = true;
    } else {
        // Fallback to Image
        // If the SVG key (this.sectionName) exists, use it.
        // If not, it means the preload might have failed or wasn't keyed correctly.
        // MainMenu.preload keys the SVG with 'section.name'.

        // Safety check: if texture key doesn't exist, log warning
        if (!this.textures.exists(this.sectionName)) {
            console.error(`SectionHunt: Texture '${this.sectionName}' missing!`);
        }

        this.sectionImage = this.add.image(width/2, height/2, this.sectionName)
            .setDisplaySize(1280 * scale, 720 * scale)
            .setDepth(0);
        this.isUsingVideo = false;
    }

    const symbolsData = this.registry.get('symbols');
    const symbols = (symbolsData && symbolsData.symbols) ? symbolsData.symbols : [];

    const shuffledSymbols = Phaser.Utils.Array.Shuffle([...symbols]);
    const sections = this.registry.get('sections');
    const section = sections.find(s => s.name === this.sectionName);

    this.eggs = this.add.group();

    if (section) {
        section.eggs.forEach((eggId, index) => {
          // Calculate egg position relative to the SCALED background
          // Original range: X (200-1270), Y (100-710)

          const originalX = Phaser.Math.Between(200, 1270);
          const originalY = Phaser.Math.Between(100, 710);

          const x = this.bgOffsetX + (originalX * scale);
          const y = this.bgOffsetY + (originalY * scale);

          const egg = this.add.image(x, y, `egg-${eggId}`)
            .setInteractive()
            .setDepth(5)
            .setDisplaySize(50, 75)
            .setAlpha(0); // Invisible until magnified

          egg.setData('eggId', eggId);
          const symbol = (index < shuffledSymbols.length) ? shuffledSymbols[index] : null;
          egg.setData('symbolDetails', symbol);

          if (symbol && symbol.filename && this.textures.exists(symbol.filename)) {
              const symbolSprite = this.add.image(x, y, symbol.filename)
                .setDepth(6)
                .setDisplaySize(50, 75)
                .setAlpha(0);
              egg.symbolSprite = symbolSprite;
          }

          // IMPORTANT: Explicit click handler for the egg
          egg.on('pointerdown', (pointer) => {
             const distSq = Phaser.Math.Distance.Squared(pointer.worldX, pointer.worldY, egg.x, egg.y);
             if (distSq < 100 * 100) { // Slightly generous click radius
                this.collectEgg(egg);
                egg.destroy();
                if (egg.symbolSprite) egg.symbolSprite.destroy();
                this.updateScore();
             }
          });

          this.eggs.add(egg);
        });
    }

    // UI Elements (Scaled by MIN to fit)
    const uiScale = Math.min(scaleX, scaleY);

    this.eggZitButton = this.add.image(0, 200 * uiScale, 'egg-zit-button').setOrigin(0, 0).setDisplaySize(150 * uiScale, 150 * uiScale)
      .setInteractive()
      .setDepth(4).setScrollFactor(0);
    this.eggZitButton.on('pointerdown', () => this.scene.start('MapScene'));
    addButtonInteraction(this, this.eggZitButton, 'drive1');

    this.eggsAmminHaul = this.add.image(0, 350 * uiScale, 'eggs-ammin-haul').setOrigin(0, 0).setDisplaySize(137 * uiScale, 150 * uiScale)
      .setInteractive()
      .setDepth(4).setScrollFactor(0);
    this.eggsAmminHaul.on('pointerdown', () => {
        this.time.delayedCall(100, () => {
             this.scene.start('EggZamRoom');
        });
    });
    addButtonInteraction(this, this.eggsAmminHaul, 'menu-click');

    this.sound.play('drive2', { volume: 0.5 });

    this.scoreImage = this.add.image(0, 0, 'score').setOrigin(0, 0).setDisplaySize(200 * uiScale, 200 * uiScale).setDepth(4).setScrollFactor(0);
    const foundEggs = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(50 * uiScale, 98 * uiScale, `${foundEggs}/${TOTAL_EGGS}`, {
        fontSize: `${42 * uiScale}px`,
        fill: '#000',
        fontStyle: 'bold',
        fontFamily: 'Comic Sans MS',
        stroke: '#fff',
        strokeThickness: 6 * uiScale
    }).setDepth(5);

    this.lastFoundCount = foundEggs;

    // Render Texture for Magnifier
    this.zoomedView = this.add.renderTexture(0, 0, 200, 200).setDepth(2).setScrollFactor(0);
    this.maskGraphics = this.add.graphics().fillCircle(100, 100, 50).setScrollFactor(0);
    // Note: mask needs to be moved in update
    this.zoomedView.setMask(this.maskGraphics.createGeometryMask());

    this.magnifyingGlass = this.add.image(0, 0, 'magnifying-glass').setOrigin(0.25, 0.2).setDepth(7).setScrollFactor(0);

    // Render Stamp
    if (this.isUsingVideo) {
        // We'll draw the video directly
    } else {
        this.renderStamp = this.make.image({ x: 0, y: 0, key: this.sectionName, add: false });
    }
    // Stamp for eggs
    this.eggStamp = this.make.image({ x: 0, y: 0, key: 'egg-1', add: false });

    // Idle Hint Timer
    this.hintTimer = this.time.addEvent({
        delay: 120000,
        callback: this.showIdleHint,
        callbackScope: this,
        loop: true
    });

    this.scale.on('resize', this.resize, this);
  }

  updateScore() {
      const foundEggs = this.registry.get('foundEggs').length;
      if (this.scoreText) this.scoreText.setText(`${foundEggs}/${TOTAL_EGGS}`);
  }

  resize(gameSize) {
      const width = gameSize.width;
      const height = gameSize.height;

      this.cameras.main.setViewport(0, 0, width, height);

      const scaleX = width / 1280;
      const scaleY = height / 720;
      const scale = Math.max(scaleX, scaleY);

      this.bgScale = scale;
      this.bgOffsetX = (width - 1280 * scale) / 2;
      this.bgOffsetY = (height - 720 * scale) / 2;

      if (this.isUsingVideo && this.sectionVideo) {
          this.sectionVideo.setPosition(width/2, height/2);
          this.sectionVideo.setDisplaySize(1280 * scale, 720 * scale);
      } else if (this.sectionImage) {
          this.sectionImage.setPosition(width/2, height/2);
          this.sectionImage.setDisplaySize(1280 * scale, 720 * scale);
      }

      // UI Resize
      const uiScale = Math.min(scaleX, scaleY);
      this.eggZitButton.setPosition(0, 200 * uiScale).setDisplaySize(150 * uiScale, 150 * uiScale);
      this.eggsAmminHaul.setPosition(0, 350 * uiScale).setDisplaySize(137 * uiScale, 150 * uiScale);
      this.scoreImage.setDisplaySize(200 * uiScale, 200 * uiScale);
      this.scoreText.setPosition(50 * uiScale, 98 * uiScale).setFontSize(`${42 * uiScale}px`);
  }

  update() {
    const pointer = this.input.activePointer;

    // Magnifier logic
    const offset = 35;
    const rtX = pointer.x + offset - 75;
    const rtY = pointer.y + offset - 53;

    this.zoomedView.setPosition(rtX, rtY);

    // Update mask position to match RT
    this.maskGraphics.clear();
    this.maskGraphics.fillCircle(100, 100, 50); // Circle in center of 200x200 RT local space
    this.maskGraphics.setPosition(rtX, rtY); // Move graphics object to RT pos

    this.zoomedView.camera.setZoom(2);

    const centerX = pointer.x + offset;
    const centerY = pointer.y + offset;

    // World point to center camera on
    this.zoomedView.camera.scrollX = centerX - 100; // 100 is half of RT width (200)
    this.zoomedView.camera.scrollY = centerY - 100;

    const magnifierRadius = 50;
    const magnifierRadiusSq = magnifierRadius * magnifierRadius;
    const magnifierScreenX = pointer.x;
    const magnifierScreenY = pointer.y;

    this.zoomedView.clear();

    // Draw background
    if (this.isUsingVideo && this.sectionVideo) {
        // Draw the object at its world position
        this.zoomedView.draw(this.sectionVideo);

    } else {
        if (!this.renderStamp) this.renderStamp = this.make.image({key: this.sectionName, add:false});
        this.renderStamp.setTexture(this.sectionName);
        this.renderStamp.setOrigin(0, 0);
        this.renderStamp.setDisplaySize(1280 * this.bgScale, 720 * this.bgScale);

        // Draw the stamp at the background's world position
        this.zoomedView.draw(this.renderStamp, this.bgOffsetX, this.bgOffsetY);
    }

    // Draw Eggs
    this.eggs.getChildren().forEach(egg => {
      if (egg && egg.active) {
        const distSq = Phaser.Math.Distance.Squared(magnifierScreenX, magnifierScreenY, egg.x, egg.y);
        const alpha = distSq < magnifierRadiusSq ? 1 : 0;

        egg.setAlpha(alpha);
        if (egg.symbolSprite) egg.symbolSprite.setAlpha(alpha);

        if (alpha > 0) {
            // Use eggStamp
            this.eggStamp.setTexture(egg.texture.key, egg.frame.name);
            this.eggStamp.setAngle(egg.angle);
            this.eggStamp.setFlipX(egg.flipX);
            this.eggStamp.setFlipY(egg.flipY);
            this.eggStamp.setOrigin(0.5, 0.5);
            this.eggStamp.setScale(egg.scaleX, egg.scaleY);

            // Draw egg at its world position
            this.zoomedView.draw(this.eggStamp, egg.x, egg.y);

            if (egg.symbolSprite && egg.symbolSprite.active) {
                this.eggStamp.setTexture(egg.symbolSprite.texture.key, egg.symbolSprite.frame.name);
                this.eggStamp.setScale(egg.symbolSprite.scaleX, egg.symbolSprite.scaleY);
                this.zoomedView.draw(this.eggStamp, egg.symbolSprite.x, egg.symbolSprite.y);
            }
        }
      }
    });

    this.magnifyingGlass.setPosition(pointer.x, pointer.y);
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

    // Scale logic
    const width = this.scale.width;
    const height = this.scale.height;
    const scaleX = width / 1280;
    const scaleY = height / 720;
    const scale = Math.min(scaleX, scaleY); // Fit logic for minigame usually better, but let's try cover or contained fit
    // Background is 1280x720. Let's cover.
    const bgScale = Math.max(scaleX, scaleY);

    // Position background centered
    this.add.image(width/2, height/2, 'egg-zam-room')
      .setDisplaySize(1280 * bgScale, 720 * bgScale)
      .setDepth(0);

    const examiner = this.add.image(0, 0, 'egg-zamminer').setOrigin(0, 0).setDepth(2);
    // Original pos: 390, 250. Size? Default.
    // Let's assume original design was 1280x720 fixed.
    // We scale everything by 'scale' (min) to ensure UI fits on screen.
    // But we need to center the "game area" in the viewport.

    const uiScale = Math.min(scaleX, scaleY);
    const offsetX = (width - 1280 * uiScale) / 2;
    const offsetY = (height - 720 * uiScale) / 2;

    // Examiner
    examiner.setPosition(offsetX + 390 * uiScale, offsetY + 250 * uiScale);
    examiner.setScale(uiScale);

    this.examiner = examiner; // Store for relative positioning

    this.add.image(offsetX + 200 * uiScale, offsetY + 50 * uiScale, 'symbol-result-summary-diag')
      .setOrigin(0, 0)
      .setDisplaySize(900 * uiScale, 600 * uiScale)
      .setDepth(1)
      .setAlpha(0);

    const eggZitButton = this.add.image(0, 200 * uiScale, 'egg-zit-button')
      .setOrigin(0, 0)
      .setDisplaySize(150 * uiScale, 131 * uiScale)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MapScene'))
      .setDepth(4).setScrollFactor(0);
    addButtonInteraction(this, eggZitButton, 'drive1');

    this.add.image(0, 0, 'score')
      .setOrigin(0, 0)
      .setDisplaySize(200 * uiScale, 200 * uiScale)
      .setDepth(4).setScrollFactor(0);

    const foundEggsCount = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(50 * uiScale, 98 * uiScale, `${foundEggsCount}/${TOTAL_EGGS}`, {
      fontSize: `${42 * uiScale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * uiScale
    }).setDepth(5);
    this.lastFoundCount = foundEggsCount;

    if (!this.registry.has('correctCategorizations')) {
      this.registry.set('correctCategorizations', 0);
    }

    this.correctText = this.add.text(100 * uiScale, 150 * uiScale, `Correct: ${this.registry.get('correctCategorizations')}`, {
      fontSize: `${32 * uiScale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * uiScale
    }).setDepth(5).setOrigin(0.5);

    // Create hover graphics for highlighting bottles
    this.hoverGraphics = this.add.graphics().setDepth(10);

    // Zones need to be positioned relative to the SCALED examiner/room
    // Original: 450, 300, 100x200
    const leftBottleZone = this.add.zone(offsetX + 450 * uiScale, offsetY + 300 * uiScale, 100 * uiScale, 200 * uiScale).setOrigin(0, 0).setInteractive();
    // Original: 750, 300, 100x200
    const rightBottleZone = this.add.zone(offsetX + 750 * uiScale, offsetY + 300 * uiScale, 100 * uiScale, 200 * uiScale).setOrigin(0, 0).setInteractive();

    const addZoneHover = (zone) => {
        zone.on('pointerover', () => {
            this.hoverGraphics.clear();
            this.hoverGraphics.lineStyle(4, 0xffff00, 1);
            this.hoverGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
            this.hoverGraphics.fillStyle(0xffff00, 0.2);
            this.hoverGraphics.fillRect(zone.x, zone.y, zone.width, zone.height);
        });

        zone.on('pointerout', () => {
            this.hoverGraphics.clear();
        });
    };

    addZoneHover(leftBottleZone);
    addZoneHover(rightBottleZone);

    leftBottleZone.on('pointerdown', () => {
      if (this.currentEgg && !this.currentEgg.categorized) {
        const isChristian = this.currentEgg.symbolData.category === 'Christian';
        if (isChristian) {
          this.sound.play('success');
          const correctCount = this.registry.get('correctCategorizations') + 1;
          this.registry.set('correctCategorizations', correctCount);
          this.correctText.setText(`Correct: ${correctCount}`);
          this.currentEgg.categorized = true;
          this.displayRandomEggInfo(offsetX, offsetY, uiScale);
        } else {
          this.sound.play('error');
          const wrongText = this.add.text(offsetX + 420 * uiScale, offsetY + 220 * uiScale, "Try again!", {
            fontSize: `${28 * uiScale}px`,
            fill: '#f00',
            fontStyle: 'bold',
            fontFamily: 'Comic Sans MS'
          }).setOrigin(0, 0).setDepth(4).setScrollFactor(0);
          this.time.delayedCall(1000, () => wrongText.destroy(), [], this);
        }
      }
    });

    rightBottleZone.on('pointerdown', () => {
      if (this.currentEgg && !this.currentEgg.categorized) {
        const isPagan = this.currentEgg.symbolData.category === 'Pagan';
        if (isPagan) {
          this.sound.play('success');
          const correctCount = this.registry.get('correctCategorizations') + 1;
          this.registry.set('correctCategorizations', correctCount);
          this.correctText.setText(`Correct: ${correctCount}`);
          this.currentEgg.categorized = true;
          this.displayRandomEggInfo(offsetX, offsetY, uiScale);
        } else {
          this.sound.play('error');
          const wrongText = this.add.text(offsetX + 420 * uiScale, offsetY + 220 * uiScale, "Try again!", {
            fontSize: `${28 * uiScale}px`,
            fill: '#f00',
            fontStyle: 'bold',
            fontFamily: 'Comic Sans MS'
          }).setOrigin(0, 0).setDepth(4).setScrollFactor(0);
          this.time.delayedCall(1000, () => wrongText.destroy(), [], this);
        }
      }
    });

    this.displayRandomEggInfo(offsetX, offsetY, uiScale);

    this.fingerCursor = this.add.image(0, 0, 'finger-cursor')
      .setOrigin(0, 0)
      .setDisplaySize(50, 75)
      .setDepth(7);

    // Store scale params for update/resize if needed (or just restart scene on resize)
    this.uiParams = { offsetX, offsetY, uiScale };

    this.scale.on('resize', () => {
        this.scene.restart(); // Simplest way to handle resizing complex UI layouts
    });
  }

  displayRandomEggInfo(offsetX, offsetY, scale) {
    const foundEggs = this.registry.get('foundEggs');

    if (this.currentEgg === null || this.currentEgg.categorized) {
      const uncategorizedEggs = foundEggs.filter(egg => !egg.categorized);
      if (uncategorizedEggs.length > 0) {
        this.currentEgg = Phaser.Utils.Array.GetRandom(uncategorizedEggs);
      } else {
        this.currentEgg = null;
        if (this.noEggsText) this.noEggsText.destroy();
        this.noEggsText = this.add.text(offsetX + 420 * scale, offsetY + 220 * scale, "All eggs have been categorized!", {
          fontSize: `${28 * scale}px`,
          fill: '#000',
          fontStyle: 'bold',
          fontFamily: 'Comic Sans MS',
          stroke: '#fff',
          strokeThickness: 3 * scale,
          wordWrap: { width: 480 * scale, useAdvancedWrap: true }
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
      const eggPosX = offsetX + 630 * scale;
      const eggPosY = offsetY + 350 * scale;
      const symbolPosX = eggPosX;
      const symbolPosY = eggPosY;

      if (this.textures.exists(`egg-${eggId}`)) {
        this.displayedEggImage = this.add.image(eggPosX, eggPosY, `egg-${eggId}`)
          .setDisplaySize(100 * scale, 125 * scale)
          .setDepth(3);
      }
      if (symbolData && symbolData.filename && this.textures.exists(symbolData.filename)) {
        this.displayedSymbolImage = this.add.image(symbolPosX, symbolPosY, symbolData.filename)
          .setDisplaySize(100 * scale, 125 * scale)
          .setDepth(3);
      }
    }
  }

  update() {
    const foundEggsCount = this.registry.get('foundEggs').length;
    if (this.scoreText && this.lastFoundCount !== foundEggsCount) {
      this.scoreText.setText(`${foundEggsCount}/${TOTAL_EGGS}`);
      this.lastFoundCount = foundEggsCount;
    }
    this.fingerCursor.setPosition(this.input.x, this.input.y);
  }
}

/**
 * Adds a "pop" animation to a game object on hover.
 */
function addButtonInteraction(scene, button, soundKey = 'success') {
  const originalScaleX = button.scaleX;
  const originalScaleY = button.scaleY;

  button.on('pointerover', () => {
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
    const musicScene = scene.scene.get('MusicScene');
    if (musicScene && musicScene.scene.isActive()) {
        musicScene.playSFX(soundKey);
    }
    scene.tweens.add({
      targets: button,
      scaleX: originalScaleX * 0.9,
      scaleY: originalScaleY * 0.9,
      duration: 50,
      ease: 'Power1'
    });
  });

  button.on('pointerup', () => {
    scene.tweens.add({
      targets: button,
      scaleX: originalScaleX * 1.1, // Return to hover state
      scaleY: originalScaleY * 1.1,
      duration: 100,
      ease: 'Power1'
    });
  });
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  scale: {
      mode: Phaser.Scale.RESIZE, // Fill the window
      parent: 'game',
      width: '100%',
      height: '100%'
  },
  scene: [MainMenu, MapScene, SectionHunt, EggZamRoom, MusicScene, UIScene],
  parent: 'game',
  backgroundColor: '#000000',
};

// Initialize the game
const game = new Phaser.Game(config);
window.game = game;
