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

    // Listen for resize events to update UI positions
    this.scale.on('resize', this.resize, this);
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
        this.drawGear(this.gearIcon, width - 60, 60);
        // Update hit area
        const hitArea = new Phaser.Geom.Circle(width - 60, 60, 40);
        this.gearIcon.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    }

    // Reposition settings panel
    if (this.settingsContainer) {
        const isVisible = this.settingsContainer.visible;
        this.settingsContainer.removeAll(true);
        this.createSettingsPanelContent(width, height);
        this.settingsContainer.setVisible(isVisible);
    }
  }

  createGearIcon() {
    const gear = this.add.graphics();
    const x = this.cameras.main.width - 60;
    const y = 60;
    this.drawGear(gear, x, y);

    // Much larger hit area (60px radius) for the gear
    const hitArea = new Phaser.Geom.Circle(x, y, 60);
    gear.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    gear.on('pointerdown', () => {
        this.openSettings();
    });

    this.gearIcon = gear;
  }

  drawGear(graphics, x, y) {
    graphics.fillStyle(0xffffff, 1);
    const radius = 12.5;
    graphics.fillCircle(x, y, radius);

    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const tx = x + Math.cos(angle) * (radius + 4);
        const ty = y + Math.sin(angle) * (radius + 4);
        graphics.fillCircle(tx, ty, 3);
    }
    graphics.fillCircle(x, y, radius);
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(x, y, 5);
  }

  createSettingsPanel() {
    this.settingsContainer = this.add.container(0, 0).setVisible(false).setDepth(100);
    this.createSettingsPanelContent(this.cameras.main.width, this.cameras.main.height);
  }

  createSettingsPanelContent(screenWidth, screenHeight) {
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
    this.settingsContainer.add(overlay);

    // Panel Background
    const panel = this.add.graphics();
    panel.fillStyle(0x333333, 1);
    panel.fillRoundedRect(x, y, width, height, 16);
    panel.lineStyle(4, 0xffffff, 1);
    panel.strokeRoundedRect(x, y, width, height, 16);
    this.settingsContainer.add(panel);

    // Title
    const title = this.add.text(screenWidth / 2, y + 40, 'Audio Settings', {
        fontSize: '32px',
        fontFamily: 'Comic Sans MS',
        fill: '#ffffff'
    }).setOrigin(0.5);
    this.settingsContainer.add(title);

    // Cute Close Button (Top Right)
    const closeSize = 40;
    const closeX = x + width - 30;
    const closeY = y + 30;

    const closeBtn = this.add.container(closeX, closeY);

    // Transparent hit area - much larger (80x80)
    const hitArea = new Phaser.Geom.Circle(0, 0, 40);

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
    closeBtn.setSize(80, 80); // Ensure container size is large enough
    closeBtn.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

    closeBtn.on('pointerdown', () => {
        this.settingsContainer.setVisible(false);
        this.gearIcon.setVisible(true);
        this.input.setDefaultCursor('none');
    });
    this.settingsContainer.add(closeBtn);

    // Calculate layout for sliders
    // Space available below title (y + 80) to bottom (y + height - 20)
    const contentTop = y + 80;
    const contentHeight = height - 100;
    const spacing = contentHeight / 3;
    const trackWidth = Math.min(200, width - 60);

    this.createSlider('Music', contentTop + spacing * 0.5, screenWidth / 2, 'music', trackWidth);
    this.createSlider('Ambient', contentTop + spacing * 1.5, screenWidth / 2, 'ambient', trackWidth);
    this.createSlider('SFX', contentTop + spacing * 2.5, screenWidth / 2, 'sfx', trackWidth);
  }

  createSlider(label, y, centerX, type, trackWidth = 200) {
    const startX = centerX - (trackWidth / 2);
    const endX = centerX + (trackWidth / 2);

    const text = this.add.text(centerX, y - 25, label, {
        fontSize: '24px',
        fontFamily: 'Comic Sans MS',
        fill: '#ffffff'
    }).setOrigin(0.5);
    this.settingsContainer.add(text);

    // Increase track hit area for easier tapping
    const track = this.add.rectangle(centerX, y + 10, trackWidth, 30, 0x888888).setAlpha(0.01).setInteractive();
    // Visual track
    const visualTrack = this.add.rectangle(centerX, y + 10, trackWidth, 4, 0x888888);
    this.settingsContainer.add(track);
    this.settingsContainer.add(visualTrack);

    // Handle
    let currentVol = 0.5;
    // Check registry first
    if (type === 'music' && this.registry.has('musicVolume')) currentVol = this.registry.get('musicVolume');
    else if (type === 'ambient' && this.registry.has('ambientVolume')) currentVol = this.registry.get('ambientVolume');
    else if (type === 'sfx' && this.registry.has('sfxVolume')) currentVol = this.registry.get('sfxVolume');

    const handleX = startX + (currentVol * trackWidth);
    // Larger handle hit area
    const handle = this.add.circle(handleX, y + 10, 20, 0xffffff).setInteractive({ draggable: true });
    this.settingsContainer.add(handle);

    const updateVolume = (x) => {
        const clampedX = Phaser.Math.Clamp(x, startX, endX);
        handle.x = clampedX;
        const volume = (clampedX - startX) / trackWidth;

        // Update Registry which triggers events
        if (type === 'music') this.registry.set('musicVolume', volume);
        else if (type === 'ambient') this.registry.set('ambientVolume', volume);
        else if (type === 'sfx') this.registry.set('sfxVolume', volume);
    };

    handle.on('drag', (pointer, dragX, dragY) => {
        updateVolume(dragX);
    });

    track.on('pointerdown', (pointer) => {
        // pointer.x is world coordinate, but since container is at 0,0, it maps directly.
        // If container moves, we'd need local transform.
        // Assuming container is fullscreen overlay at 0,0.
        updateVolume(pointer.x);
    });
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
    this.load.video('intro-video', 'assets/video/HeIsRisen-Intro.mp4');
    this.load.image('finger-cursor', 'assets/cursor/pointer-finger-pointer.png');

    // Audio assets
    this.load.audio('background-music', 'assets/audio/background-music.mp3');
    this.load.audio('collect', 'assets/audio/collect1.mp3');
    this.load.audio('success', 'assets/audio/success.wav');
    this.load.audio('error', 'assets/audio/error.wav');
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
    try {
      this.input.setDefaultCursor('none');

      // Get scale factors based on game dimensions
      const scaleX = this.game.config.width / 1280;
      const scaleY = this.game.config.height / 720;
      const scale = Math.min(scaleX, scaleY);
      this.gameScale = scale;

      // NEW: Initialize all game variables
      // console.log('MainMenu: Initializing game state');
      this.registry.set('foundEggs', []);
      this.registry.set('correctCategorizations', 0);
      this.registry.set('currentScore', 0);

      try {
          this.registry.set('highScore', parseInt(localStorage.getItem('highScore')) || 0);
      } catch (e) {
          console.warn('LocalStorage access failed:', e);
          this.registry.set('highScore', 0);
      }
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

      // Intro Video - centered
      const introVideo = this.add.video(this.game.config.width / 2, this.game.config.height / 2, 'intro-video');
      this.introVideo = introVideo; // Store reference for resizing
      introVideo.setMute(true); // Start muted to allow autoplay
      introVideo.disableInteractive(); // Ensure video ignores input
      try {
        introVideo.play(true); // Loop
      } catch (e) {
        console.warn('Video autoplay synchronous error:', e);
      }

      // Remove static text overlays as they are likely in the video
      // this.add.text(640 * scale, 0, `He Is Risen!`, ...);
      // this.add.text(0, 522 * scale, `Hunt with P.A.L.`, ...);
      // this.add.text(0, 580 * scale, `for the Meaning of Easter`, ...);

      // Only show cursor on desktop
      if (!this.sys.game.device.os.desktop) {
        this.fingerCursor = null;
      } else {
        this.fingerCursor = this.add.image(0, 0, 'finger-cursor')
          .setOrigin(0.5, 0.5)
          .setDisplaySize(100 * scale, 150 * scale)
          .setDepth(1000); // Ensure cursor is on top of everything
      }

      // Handle both mouse and touch input, request fullscreen on first click
      const safeRequestFullscreen = (element) => {
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(err => {}); // console.log('Fullscreen failed:', err));
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen().catch(err => {}); // console.log('Fullscreen failed:', err));
        }
      };

      // NEW INTRO SEQUENCE LOGIC
      // 1. Silent Loop + "Tap anywhere to start"
      // 2. User Tap -> Unmute, Fullscreen, Wait 3s
      // 3. Show "Play Now" Button
      // 4. User Tap "Play Now" -> Start Game

      // Initialize volume registry early
      if (!this.registry.has('musicVolume')) this.registry.set('musicVolume', 0.5);
      if (!this.registry.has('ambientVolume')) this.registry.set('ambientVolume', 0.5);
      if (!this.registry.has('sfxVolume')) this.registry.set('sfxVolume', 0.5);

      // Launch UI Scene immediately (hidden initially)
      if (!this.scene.get('UIScene').scene.isActive()) {
          this.scene.launch('UIScene');
      }

      // Initial Overlay Text
      const tapToStartText = this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'Tap anywhere to start', {
          fontSize: '48px',
          fontFamily: 'Comic Sans MS',
          fill: '#ffffff',
          stroke: '#000000',
          strokeThickness: 6
      }).setOrigin(0.5).setDepth(100);

      // "Play Now" Button Container (Initially Hidden)
      const buttonWidth = 400;
      const buttonHeight = 100;
      const btnX = this.game.config.width / 2;
      const btnY = 580 * scale;

      const startBtnContainer = this.add.container(btnX, btnY).setVisible(false).setDepth(101);
      this.startBtnContainer = startBtnContainer;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(0xff0000, 1);
      btnBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, buttonHeight / 2);
      btnBg.lineStyle(4, 0xffffff, 1);
      btnBg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, buttonHeight / 2);
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
      // Increased hit area height for easier tapping
      startBtnContainer.setInteractive(new Phaser.Geom.Rectangle(-buttonWidth/2, -buttonHeight, buttonWidth, buttonHeight * 2), Phaser.Geom.Rectangle.Contains);
      startBtnContainer.setScale(scale);

      // State Management
      let introState = 'waiting_for_interaction'; // waiting_for_interaction -> playing_intro -> ready_to_play

      const handleGlobalTap = () => {
          if (introState !== 'waiting_for_interaction') return;

          introState = 'playing_intro';
          tapToStartText.setVisible(false);

          // Resume Audio Context
          if (this.sound.context.state === 'suspended') {
              this.sound.context.resume();
          }

          // Unmute Video
          if (this.introVideo) {
              this.introVideo.setMute(false);
              const vol = this.registry.get('musicVolume');
              this.introVideo.setVolume(vol !== undefined ? vol : 0.5);
              // Ensure it's playing
              if (this.introVideo.isPaused()) this.introVideo.play(true);
          }

          // Fullscreen
          const canvas = this.game.canvas;
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
              safeRequestFullscreen(canvas);
              if (screen.orientation && screen.orientation.lock) {
                  screen.orientation.lock('landscape').catch(() => {});
              }
          } else {
              safeRequestFullscreen(canvas);
          }

          // Wait 3 seconds then show Play Button
          this.time.delayedCall(3000, () => {
              introState = 'ready_to_play';
              startBtnContainer.setVisible(true);
              startBtnContainer.setScale(0);

              // Kill any existing tweens to prevent conflicts
              this.tweens.killTweensOf(startBtnContainer);

              // Pop in effect
              this.tweens.add({
                  targets: startBtnContainer,
                  scaleX: scale,
                  scaleY: scale,
                  duration: 500,
                  ease: 'Back.out',
                  onComplete: () => {
                      // Start pulsing after pop-in is complete
                      this.tweens.add({
                        targets: startBtnContainer,
                        scaleX: scale * 1.05,
                        scaleY: scale * 1.05,
                        duration: 800,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                      });
                  }
              });
          });
      };

      // Add one-time listener for the global tap
      this.input.once('pointerdown', handleGlobalTap);

      // Play Now Handler
      startBtnContainer.on('pointerdown', () => {
          // Fade out video audio
          this.tweens.add({
              targets: this.introVideo,
              volume: 0,
              duration: 500,
              onComplete: () => {
                  if (this.introVideo) {
                      this.introVideo.stop();
                      this.introVideo.destroy();
                  }

                  // Start Background Music
                  if (!this.scene.get('MusicScene').scene.isActive()) {
                      this.scene.launch('MusicScene');
                  }

                  this.sound.play('drive1', { volume: 0.5 });
                  this.scene.start('MapScene');
              }
          });
      });

      // Clean up on shutdown
      this.events.once('shutdown', () => {
          if (introVideo) {
              introVideo.stop();
              introVideo.destroy();
          }
      });

      // Ensure loading text is destroyed if it persists (safety check)
      // Note: loadingText is local to preload, so we can't access it here directly easily unless stored on this.
      // But preload logic destroys it on complete.

    } catch (error) {
       console.error("Critical error in MainMenu create:", error);
       // Manually trigger the global error handler
       window.dispatchEvent(new ErrorEvent('error', { message: error.message }));
    }
  }

  update() {
    if (this.fingerCursor) {
      this.fingerCursor.setPosition(this.input.x, this.input.y);
    }

    // Ensure video size is correct once texture loads
    if (this.introVideo && this.introVideo.active && this.introVideo.width > 0) {
        if (Math.abs(this.introVideo.displayWidth - this.game.config.width) > 10) {
            this.introVideo.setDisplaySize(this.game.config.width, this.game.config.height);
        }
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
    this.gameScale = scale;

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
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 137, 150), Phaser.Geom.Rectangle.Contains);

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
        .setDisplaySize(100 * scale, 150 * scale);
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
    if (this.sectionName === 'grand-prismatic') {
        this.load.video('grand-prismatic-video', 'assets/video/grand-prismatic.mp4');
        this.load.image('grand-prismatic-bg', 'assets/map/sections/grand-prismatic.png');
    } else if (this.sectionName === 'mammoth-hot-springs') {
        this.load.image(this.sectionName, 'assets/map/sections/mammoth-hot-springs.jpg');
    } else {
        this.load.svg(this.sectionName, `assets/map/sections/${this.sectionName}.svg`);
    }

    // Removed redundant loading of eggs, symbols, and UI elements.
    // They are now loaded in MainMenu.

    this.load.on('loaderror', (file) => {
      if (file.type === 'image' || file.type === 'video') {
        console.error(`PRELOAD ERROR: Failed to load asset: Key='${file.key}', URL='${file.url}'`);
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

      // Get symbol texture if available
      let symbolTexture = null;
      if (egg.symbolSprite && egg.symbolSprite.active) {
          symbolTexture = egg.symbolSprite.texture.key;
      }

      this.showCollectionFeedback(egg.x, egg.y, egg.texture.key, symbolTexture);
      foundEggs.push(eggInfo);
      this.registry.set('foundEggs', foundEggs);
      if (eggData) {
        eggData.collected = true;
        this.registry.set('eggData', eggDataArray);
      }

      // Reset hint timer
      if (this.hintTimer) {
          this.hintTimer.reset({ delay: 120000, callback: this.showIdleHint, callbackScope: this, loop: true });
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

  showCollectionFeedback(x, y, eggTexture, symbolTexture) {
    const scale = this.gameScale;

    // Egg Sprite
    const eggSprite = this.add.image(x, y, eggTexture).setDepth(20).setDisplaySize(50 * scale, 75 * scale);
    this.tweens.add({
        targets: eggSprite,
        y: y - (60 * scale),
        alpha: 0,
        duration: 1000,
        ease: 'Power1',
        onComplete: () => eggSprite.destroy()
    });

    // Symbol Sprite
    if (symbolTexture) {
        const symSprite = this.add.image(x, y, symbolTexture).setDepth(21).setDisplaySize(50 * scale, 75 * scale);
        this.tweens.add({
            targets: symSprite,
            y: y - (60 * scale),
            alpha: 0,
            duration: 1000,
            ease: 'Power1',
            onComplete: () => symSprite.destroy()
        });
    }

    const feedback = this.add.text(x, y - (40 * scale), 'Found!', {
        fontSize: `${32 * scale}px`,
        fontFamily: 'Comic Sans MS',
        fill: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4 * scale
    }).setOrigin(0.5).setDepth(22);

    this.tweens.add({
        targets: feedback,
        y: y - (100 * scale),
        alpha: 0,
        duration: 1000,
        ease: 'Power1',
        onComplete: () => feedback.destroy()
    });
  }

  showIdleHint() {
    const foundEggs = this.registry.get('foundEggs');
    const sections = this.registry.get('sections');
    // For mobile, section lookup depends on if 'sections' structure is same.
    // m/main.js create sets registry sections: { name: section.name, eggs: sectionEggs }
    const currentSection = sections.find(s => s.name === this.sectionName);
    const scale = this.gameScale;

    if (!currentSection) return;

    const eggsInSection = currentSection.eggs; // Array of IDs in this section's cluster
    const foundIds = foundEggs.map(e => e.eggId);
    const remainingCount = eggsInSection.filter(id => !foundIds.includes(id)).length;

    if (remainingCount > 0) {
        const musicScene = this.scene.get('MusicScene');
        if (musicScene) musicScene.playSFX('menu-click');

        const hintText = this.add.text(this.game.config.width / 2, this.game.config.height * 0.9, `Hint: ${remainingCount} eggs left here!`, {
            fontSize: `${32 * scale}px`,
            fontFamily: 'Comic Sans MS',
            fill: '#ffffff',
            backgroundColor: '#00000088',
            padding: { x: 10 * scale, y: 5 * scale },
            stroke: '#000000',
            strokeThickness: 4 * scale
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

    const scaleX = this.game.config.width / 1280;
    const scaleY = this.game.config.height / 720;
    const scale = Math.min(scaleX, scaleY);
    this.gameScale = scale;

    this.cameras.main.setBounds(0, 0, this.game.config.width, this.game.config.height);
    this.cameras.main.setViewport(0, 0, this.game.config.width, this.game.config.height);
    this.cameras.main.setPosition(0, 0);

    if (this.sectionName === 'grand-prismatic') {
        if (this.cache.video.exists('grand-prismatic-video')) {
            this.sectionImage = this.add.video(0, 0, 'grand-prismatic-video')
                .setOrigin(0, 0)
                .setDisplaySize(this.game.config.width, this.game.config.height)
                .setDepth(0)
                .disableInteractive(); // Ensure background video is non-interactive
            this.sectionImage.play(true); // Loop

            // Error handling for playback issues
            this.sectionImage.on('error', () => {
                 console.warn('Video playback error, falling back to image');
                 this.sectionImage.destroy();
                 this.sectionImage = this.add.image(0, 0, 'grand-prismatic-bg')
                    .setOrigin(0, 0)
                    .setDisplaySize(this.game.config.width, this.game.config.height)
                    .setDepth(0);
            });
        } else {
             // Fallback if video failed to load
             this.sectionImage = this.add.image(0, 0, 'grand-prismatic-bg')
                .setOrigin(0, 0)
                .setDisplaySize(this.game.config.width, this.game.config.height)
                .setDepth(0);
        }
    } else {
        this.sectionImage = this.add.image(0, 0, this.sectionName)
            .setOrigin(0, 0)
            .setDisplaySize(this.game.config.width, this.game.config.height)
            .setDepth(0);
    }

    const eggData = this.registry.get('eggData') || [];
    const sectionEggs = eggData.filter(e => e.section === this.sectionName && !e.collected);
    this.eggs = this.add.group();
    // console.log(`SectionHunt: Creating ${sectionEggs.length} uncollected eggs for ${this.sectionName}`);

    sectionEggs.forEach(eggData => {
      const egg = this.add.image(eggData.x, eggData.y, `egg-${eggData.eggId}`)
        .setInteractive()
        .setDepth(5)
        .setDisplaySize(100 * scale, 150 * scale) // Doubled size
        .setAlpha(0);
      egg.setData('eggId', eggData.eggId);
      egg.setData('symbolDetails', eggData.symbol);
      if (eggData.symbol && eggData.symbol.filename) {
        const textureKey = eggData.symbol.filename;
        if (this.textures.exists(textureKey)) {
          const symbolSprite = this.add.image(eggData.x, eggData.y, textureKey)
            .setDepth(6)
            .setDisplaySize(100 * scale, 150 * scale) // Doubled size
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
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 150, 150), Phaser.Geom.Rectangle.Contains)
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
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 137, 150), Phaser.Geom.Rectangle.Contains)
      .setDepth(4);

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

    const diameter = 200 * scale; // Doubled size
    this.zoomedView = this.add.renderTexture(0, 0, diameter, diameter)
      .setDepth(2)
      .setScrollFactor(0)
      .setOrigin(0.5, 0.5); // Center origin for easier positioning
    this.maskGraphics = this.add.graphics()
      .setScrollFactor(0);
    // Draw circle centered at 0,0 relative to graphics object
    this.maskGraphics.fillCircle(0, 0, 100 * scale); // Doubled radius
    this.zoomedView.setMask(this.maskGraphics.createGeometryMask());

    this.magnifyingGlass = this.add.image(0, 0, 'magnifying-glass')
      .setOrigin(1, 1) // Anchor at bottom-right (handle tip)
      .setDepth(7)
      .setScrollFactor(0);

    // Bolt Optimization: Render Stamp for single-pass drawing
    this.renderStamp = this.make.image({ x: 0, y: 0, key: this.sectionName, add: false });

    // Idle Hint Timer (2 minutes)
    this.hintTimer = this.time.addEvent({
        delay: 120000,
        callback: this.showIdleHint,
        callbackScope: this,
        loop: true
    });

    this.fingerCursor = this.add.image(0, 0, 'finger-cursor')
        .setOrigin(0.5, 0.5)
        .setDepth(8)
        .setScrollFactor(0)
        .setVisible(false);

    // Global capture handler
    this.input.on('pointerdown', (pointer) => {
      // Calculate lens position based on pointer
      const scale = this.gameScale;

      // New offsets for doubled size (200x250 display size)
      // Visual lens center is approx (-130 * scale, -180 * scale) relative to handle tip
      // Shifted "Up and Left" a bit more as requested
      const lensOffsetX = -130 * scale;
      const lensOffsetY = -180 * scale;

      const lensX = pointer.x + lensOffsetX;
      const lensY = pointer.y + lensOffsetY;
      const captureRadius = 110 * scale; // Slightly larger than visual radius (100)

      // Check all eggs
      this.eggs.getChildren().forEach(egg => {
        if (egg.active && !egg.getData('collected')) { // collected check might be redundant if we destroy, but safe
           // Check if clicking on egg OR clicking on handle (when egg is under lens)
           const distToClick = Phaser.Math.Distance.Between(pointer.x, pointer.y, egg.x, egg.y);
           const distToLens = Phaser.Math.Distance.Between(lensX, lensY, egg.x, egg.y);

           // Increased capture radius logic for easier finding
           if (distToClick < captureRadius || distToLens < captureRadius) {
               this.collectEgg(egg);
               egg.destroy();
               if (egg.symbolSprite) egg.symbolSprite.destroy();
           }
        }
      });
    });
  }

  update() {
    const pointer = this.input.activePointer;
    const scale = this.gameScale;

    // Magnifying glass display size is 200*scale x 250*scale.
    // Texture is 200x250.
    // Visual scale factor relative to texture is 1.0 * scale.
    // Handle tip is at bottom-right (200, 250).
    // Lens center is approx (80, 80).
    // Offset in texture pixels: (-120, -170).
    // We shift it "Up and Left" a bit more per request: (-130, -180).

    const lensOffsetX = -130 * scale;
    const lensOffsetY = -180 * scale;

    const lensX = pointer.x + lensOffsetX;
    const lensY = pointer.y + lensOffsetY;

    // Ensure video size is correct once texture loads
    if (this.sectionName === 'grand-prismatic' && this.sectionImage && this.sectionImage.active && this.sectionImage.width > 0) {
        if (Math.abs(this.sectionImage.displayWidth - this.game.config.width) > 10) {
             this.sectionImage.setDisplaySize(this.game.config.width, this.game.config.height);
        }
    }

    // Update Zoomed View Position (centered on lens)
    this.zoomedView.setPosition(lensX, lensY);
    this.maskGraphics.setPosition(lensX, lensY);

    const magnifierRadius = 100 * scale; // Visual radius for egg visibility (doubled)
    const zoom = 2;
    const diameter = 200 * scale; // Doubled
    const viewWidth = diameter / zoom;
    const viewHeight = diameter / zoom;
    const scrollX = lensX - viewWidth / 2;
    const scrollY = lensY - viewHeight / 2;

    this.zoomedView.clear();

    // Draw background using renderStamp to avoid dirtying scene object
    if (this.sectionName === 'grand-prismatic' && this.sectionImage && this.sectionImage.active) {
         this.renderStamp.texture = this.sectionImage.texture;
         this.renderStamp.frame = this.sectionImage.frame;
    } else {
         this.renderStamp.setTexture(this.sectionName);
    }
    this.renderStamp.setOrigin(0, 0);
    this.renderStamp.setDisplaySize(this.game.config.width, this.game.config.height);
    this.renderStamp.setScale(this.renderStamp.scaleX * zoom, this.renderStamp.scaleY * zoom);
    this.renderStamp.setAngle(0);
    this.renderStamp.setRotation(0);
    this.renderStamp.setFlipX(false);
    this.renderStamp.setFlipY(false);
    this.zoomedView.draw(this.renderStamp, (0 - scrollX) * zoom, (0 - scrollY) * zoom);

    // Single pass for visibility update and drawing
    this.eggs.getChildren().forEach(egg => {
      if (egg && egg.active) {
          // Update visibility
          const distance = Phaser.Math.Distance.Between(lensX, lensY, egg.x, egg.y);
          const alpha = distance < magnifierRadius ? 1 : 0;
          egg.setAlpha(alpha);
          if (egg.symbolSprite) {
            egg.symbolSprite.setAlpha(alpha);
          }

          if (egg.visible && egg.alpha > 0) {
             // Draw Egg using renderStamp
             this.renderStamp.setTexture(egg.texture.key, egg.frame.name);
             this.renderStamp.setAngle(egg.angle);
             this.renderStamp.setFlipX(egg.flipX);
             this.renderStamp.setFlipY(egg.flipY);
             this.renderStamp.setOrigin(0.5, 0.5);
             this.renderStamp.setScale(egg.scaleX * zoom, egg.scaleY * zoom);
             this.zoomedView.draw(this.renderStamp, (egg.x - scrollX) * zoom, (egg.y - scrollY) * zoom);

             // Draw Symbol using renderStamp
             if (egg.symbolSprite && egg.symbolSprite.active && egg.symbolSprite.visible) {
                 this.renderStamp.setTexture(egg.symbolSprite.texture.key, egg.symbolSprite.frame.name);
                 this.renderStamp.setAngle(egg.symbolSprite.angle);
                 this.renderStamp.setFlipX(egg.symbolSprite.flipX);
                 this.renderStamp.setFlipY(egg.symbolSprite.flipY);
                 this.renderStamp.setScale(egg.symbolSprite.scaleX * zoom, egg.symbolSprite.scaleY * zoom);
                 this.zoomedView.draw(this.renderStamp, (egg.symbolSprite.x - scrollX) * zoom, (egg.symbolSprite.y - scrollY) * zoom);
             }
          }
      }
    });

    // Handle Button Hover and Cursor Swap
    const buttons = [this.eggZitButton, this.eggsAmminHaul];
    let isHoveringButton = false;

    buttons.forEach(btn => {
        if (btn && btn.active) {
             // Store base scale if not already stored
             if (btn.baseScaleX === undefined) btn.baseScaleX = btn.scaleX;
             if (btn.baseScaleY === undefined) btn.baseScaleY = btn.scaleY;

             const bounds = btn.getBounds();
             if (bounds.contains(pointer.x, pointer.y)) {
                 isHoveringButton = true;
                 if (!btn.isHovered) {
                     btn.isHovered = true;
                     // Use absolute scale based on baseScale
                     this.tweens.add({
                         targets: btn,
                         scaleX: btn.baseScaleX * 1.1,
                         scaleY: btn.baseScaleY * 1.1,
                         duration: 100,
                         ease: 'Sine.easeInOut'
                     });
                 }
             } else {
                 if (btn.isHovered) {
                     btn.isHovered = false;
                     // Return to base scale
                     this.tweens.add({
                         targets: btn,
                         scaleX: btn.baseScaleX,
                         scaleY: btn.baseScaleY,
                         duration: 100,
                         ease: 'Sine.easeInOut'
                     });
                 }
             }
        }
    });

    if (isHoveringButton) {
        if (this.magnifyingGlass) this.magnifyingGlass.setVisible(false);
        if (this.zoomedView) this.zoomedView.setVisible(false);
        if (this.maskGraphics) this.maskGraphics.setVisible(false);

        if (this.fingerCursor) {
            this.fingerCursor.setVisible(true);
            this.fingerCursor.setDisplaySize(100 * scale, 150 * scale); // Doubled cursor size
            this.fingerCursor.setPosition(pointer.x, pointer.y);
        }
    } else {
        if (this.magnifyingGlass) {
             this.magnifyingGlass.setVisible(true);
             this.magnifyingGlass.setDisplaySize(200 * scale, 250 * scale); // Doubled size
             this.magnifyingGlass.setPosition(pointer.x, pointer.y);
        }
        if (this.zoomedView) this.zoomedView.setVisible(true);
        if (this.maskGraphics) this.maskGraphics.setVisible(true);
        if (this.fingerCursor) this.fingerCursor.setVisible(false);
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
    this.gameScale = 1;
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
    this.gameScale = Math.min(scaleX, scaleY);

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setViewport(0, 0, width, height);
    this.cameras.main.setPosition(0, 0);

    this.background = this.add.image(0, 0, 'egg-zam-room')
      .setOrigin(0, 0)
      .setDepth(0)
      .setDisplaySize(width, height);

    const tanBoxCenterX = (640 / 1280) * width;
    const examinerWidth = 400 * this.gameScale;
    const examinerHeight = 500 * this.gameScale;
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
      .setDisplaySize(900 * this.gameScale, 600 * this.gameScale)
      .setAlpha(0);

    this.eggZitButton = this.add.image(0, 200 * this.gameScale, 'egg-zit-button')
      .setOrigin(0, 0)
      .setDisplaySize(150 * this.gameScale, 131 * this.gameScale)
      .setInteractive()
      .on('pointerdown', () => this.scene.start('MapScene'))
      .setDepth(4)
      .setScrollFactor(0);
    addButtonInteraction(this, this.eggZitButton, 'drive1');

    this.scoreImage = this.add.image(0, 0, 'score')
      .setOrigin(0, 0)
      .setDisplaySize(200 * this.gameScale, 200 * this.gameScale)
      .setDepth(4)
      .setScrollFactor(0);
    const foundEggsCount = this.registry.get('foundEggs').length;
    this.scoreText = this.add.text(50 * this.gameScale, 98 * this.gameScale, `${foundEggsCount}/${TOTAL_EGGS}`, {
      fontSize: `${42 * this.gameScale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * this.gameScale
    }).setDepth(5);

    if (!this.registry.has('correctCategorizations')) {
      this.registry.set('correctCategorizations', 0);
    }
    this.correctText = this.add.text(15 * this.gameScale, 148 * this.gameScale, `Correct: ${this.registry.get('correctCategorizations')}`, {
      fontSize: `${32 * this.gameScale}px`,
      fill: '#000',
      fontStyle: 'bold',
      fontFamily: 'Comic Sans MS',
      stroke: '#fff',
      strokeThickness: 6 * this.gameScale
    }).setDepth(5);

    const zoneWidth = 200 * this.gameScale;
    const zoneHeight = 400 * this.gameScale;
    const zoneY = examinerY + 100 * this.gameScale;

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
          const wrongText = this.add.text(700 * this.gameScale, 220 * this.gameScale, "Try again!", {
            fontSize: `${28 * this.gameScale}px`,
            fill: '#f00',
            fontStyle: 'bold',
            fontFamily: 'Comic Sans MS',
            stroke: '#fff',
            strokeThickness: 3 * this.gameScale
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
          const wrongText = this.add.text(700 * this.gameScale, 220 * this.gameScale, "Try again!", {
            fontSize: `${28 * this.gameScale}px`,
            fill: '#f00',
            fontStyle: 'bold',
            fontFamily: 'Comic Sans MS',
            stroke: '#fff',
            strokeThickness: 3 * this.gameScale
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
        .setDisplaySize(100 * this.gameScale, 150 * this.gameScale)
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
          fontSize: `${28 * this.gameScale}px`,
          fill: '#000',
          fontStyle: 'bold',
          fontFamily: 'Comic Sans MS',
          stroke: '#fff',
          strokeThickness: 3 * this.gameScale,
          wordWrap: { width: 480 * this.gameScale, useAdvancedWrap: true }
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
      const windowCenterX = 196 * this.gameScale;
      const windowBottomY = 190 * this.gameScale;
      const eggHeight = 125 * this.gameScale;
      const symbolHeight = 125 * this.gameScale;

      const eggPosX = this.examiner.x + windowCenterX;
      const eggPosY = this.examiner.y + windowBottomY - (eggHeight / 2);
      const symbolPosX = this.examiner.x + windowCenterX;
      const symbolPosY = this.examiner.y + windowBottomY - (symbolHeight / 2);

      if (this.textures.exists(`egg-${eggId}`)) {
        this.displayedEggImage = this.add.image(eggPosX, eggPosY, `egg-${eggId}`)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(100 * this.gameScale, 125 * this.gameScale)
          .setDepth(3);
      }
      if (symbolData && symbolData.filename && this.textures.exists(symbolData.filename)) {
        this.displayedSymbolImage = this.add.image(symbolPosX, symbolPosY, symbolData.filename)
          .setOrigin(0.5, 0.5)
          .setDisplaySize(100 * this.gameScale, 125 * this.gameScale)
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
window.game = game; // Expose for debugging/verification

// Global error handler for mobile debugging
window.addEventListener('error', function (event) {
    const errorMsg = event.message || "Unknown error";
    // Create a temporary text element to show error on screen
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.backgroundColor = 'red';
    div.style.color = 'white';
    div.style.zIndex = '10000';
    div.style.fontSize = '14px';
    div.style.padding = '10px';
    div.innerText = 'Global Error: ' + errorMsg;
    document.body.appendChild(div);
});

/**
 * Adds a "press" animation to a game object on touch.
 * @param {Phaser.Scene} scene - The scene the object belongs to.
 * @param {Phaser.GameObjects.GameObject} button - The game object to animate.
 * @param {string} [soundKey='success'] - The key of the sound to play on click.
 */
function addButtonInteraction(scene, button, soundKey = 'success') {
  let localBaseX, localBaseY;

  button.on('pointerdown', () => {
    // Try to play sound via MusicScene if available to ensure persistence
    const musicScene = scene.scene.get('MusicScene');
    if (musicScene && musicScene.scene.isActive()) {
        musicScene.playSFX(soundKey);
    } else if (soundKey && scene.sound.get(soundKey)) {
        scene.sound.play(soundKey, { volume: 0.5 });
    }

    // Determine the resting scale
    // If the button has an explicit baseScale (from hover logic), use it.
    // Otherwise, capture the current scale on first interaction or if not tweening.
    if (button.baseScaleX !== undefined) {
        localBaseX = button.baseScaleX;
        localBaseY = button.baseScaleY;
    } else if (localBaseX === undefined || !scene.tweens.isTweening(button)) {
        localBaseX = button.scaleX;
        localBaseY = button.scaleY;
    }

    scene.tweens.killTweensOf(button);
    scene.tweens.add({
      targets: button,
      scaleX: localBaseX * 0.9,
      scaleY: localBaseY * 0.9,
      duration: 50,
      ease: 'Power1'
    });
  });

  const restore = () => {
    if (localBaseX !== undefined) {
      // If the button has dynamic baseScale (hover), update local to match
      if (button.baseScaleX !== undefined) {
          localBaseX = button.baseScaleX;
          localBaseY = button.baseScaleY;
      }

      scene.tweens.killTweensOf(button);
      scene.tweens.add({
        targets: button,
        scaleX: localBaseX,
        scaleY: localBaseY,
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
    if (scene.gameScale) scene.gameScale = scale;
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
      if (scene.startBtnContainer) {
        scene.startBtnContainer.setPosition(width / 2, 580 * scale);
        scene.startBtnContainer.setScale(scale);
        // Reset tween to match new scale to prevent jumps
        if (scene.tweens.isTweening(scene.startBtnContainer)) {
           scene.tweens.killTweensOf(scene.startBtnContainer);
           scene.tweens.add({
              targets: scene.startBtnContainer,
              scaleX: scale * 1.05,
              scaleY: scale * 1.05,
              duration: 800,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
        }
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
        scene.fingerCursor.setDisplaySize(100 * scale, 150 * scale);
      }
    }
    if (scene.scene.key === 'SectionHunt') {
      if (scene.sectionImage) {
        scene.sectionImage.setDisplaySize(width, height);
      }
      if (scene.eggs) {
        scene.eggs.getChildren().forEach(egg => {
          if (egg && egg.active) {
            egg.setDisplaySize(100 * scale, 150 * scale); // Doubled
            if (egg.symbolSprite) {
              egg.symbolSprite.setDisplaySize(100 * scale, 150 * scale); // Doubled
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
        // Position set in update
        const diameter = 200 * scale; // Doubled
        scene.zoomedView.setSize(diameter, diameter);
      }
      if (scene.maskGraphics) {
        scene.maskGraphics.clear();
        scene.maskGraphics.fillCircle(0, 0, 100 * scale); // Doubled radius
      }
      if (scene.magnifyingGlass) {
        scene.magnifyingGlass.setDisplaySize(200 * scale, 250 * scale); // Doubled
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
      if (scene.fingerCursor) scene.fingerCursor.setDisplaySize(100 * scale, 150 * scale);
    }
  });
}

game.events.on('ready', () => {
  resizeGame();
  window.addEventListener('resize', resizeGame);
  window.addEventListener('orientationchange', resizeGame);
});
