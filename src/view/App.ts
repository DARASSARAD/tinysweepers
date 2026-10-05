import { Application, Assets, Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import logoUrl from '../../TinySweeperdLogo-Photoroom.png?url';
import { AudioManager } from '../audio/AudioManager';
import { Config } from '../core/Config';
import { fitPlayArea } from '../core/Layout';
import { GameModel } from '../logic/GameModel';
import { levels } from '../logic/Levels';
import { createPlatform } from '../platform';
import { createDebugPanel } from '../platform/DebugPanel';
import type { MockPlatform } from '../platform/MockPlatform';
import { PlatformSession } from '../platform/PlatformSession';
import { createAtlas } from './Atlas';
import { BoardView } from './BoardView';
import { BotView } from './BotView';
import { CrateView } from './CrateView';
import { CrateTweens } from './CrateTweens';
import type { CrateData } from '../logic/LevelData';
import { drawDocks } from './DockView';
import { button, text } from './Elements';
import { Puffs } from './fx/Puffs';
import { Pool } from './Pool';
import { WinScreen } from './WinScreen';
import { LoseScreen } from './LoseScreen';
import { TutorialView } from './TutorialView';
import { drawConnections } from './ConnectedCrates';
import { FeatureUnlock } from './FeatureUnlock';
import { BoosterUnlock } from './BoosterUnlock';
import { boosterTutorialLevel } from '../logic/BoosterTutorial';
import { MainMenu } from './MainMenu';
import { SettingsPanel } from './SettingsPanel';
import { CoinWallet } from '../logic/CoinWallet';
import { coinIcon } from './CoinIcon';
import { settingsGear } from './UITheme';
import { BoosterButton } from './BoosterButton';
import { NewBoosterUnlock } from './NewBoosterUnlock';
import { BoosterGuide } from './BoosterGuide';
import { SpeedBoost } from '../logic/SpeedBoost';
import { SpeedShop } from './SpeedShop';
import { SpeedButton } from './SpeedButton';
import { BoosterShop, boosterPrices, type BoosterKind } from './BoosterShop';

declare const __PLATFORM__: 'local' | 'poki' | 'crazygames';

export async function createGame() {
  const app = new Application();
  await app.init({ resizeTo: window, background: '#eee5d6',
    resolution: Math.min(window.devicePixelRatio || 1, Config.maxResolution),
    autoDensity: true, antialias: true, preference: 'webgl' });
  document.querySelector('#app')!.appendChild(app.canvas);
  app.canvas.setAttribute('role', 'img');
  app.canvas.tabIndex = 0;
  app.canvas.setAttribute('aria-label', 'Tiny Sweepers. Tap a top crate to send matching bots. Keyboard: 1 to 4 select lanes, R retries, Space opens settings, M toggles sound.');
  const status = document.createElement('p');
  status.className = 'sr-only';
  status.setAttribute('aria-live', 'polite');
  document.querySelector('#app')!.appendChild(status);
  const audio = new AudioManager();
  let adBlocked = false;
  const adapter = createPlatform();
  const platform = new PlatformSession(adapter, {
    blockInput: blocked => { adBlocked = blocked; },
    muteAudio: muted => { audio.adMuted = muted; if (muted) audio.pause(); else audio.unlock(); },
  }, __PLATFORM__ !== 'crazygames'); // Basic Launch has no monetization.
  await platform.init();
  const debugPanel = __PLATFORM__ === 'local' ? createDebugPanel(adapter as MockPlatform, platform) : null;
  let cratePickerCount = 0;
  let gold = 500;
  let hapticsEnabled = true;
  let levelIndex = 0;
  let savedProgress = false;
  try {
    const saved = JSON.parse(await platform.loadData(Config.settingsKey) ?? '{}') as { sound?: boolean; music?: boolean; haptics?: boolean };
    audio.enabled = saved.sound !== false;
    audio.musicEnabled = saved.music !== false;
    hapticsEnabled = saved.haptics !== false;
    const savedPowerups = JSON.parse(await platform.loadData(Config.powerupsKey) ?? '{}') as { cratePickerCount?: number };
    if (Number.isInteger(savedPowerups.cratePickerCount) && savedPowerups.cratePickerCount! >= 0) {
      cratePickerCount = savedPowerups.cratePickerCount!;
    }
    const progressData = await platform.loadData(Config.progressKey);
    savedProgress = progressData !== null;
    const progress = Number(progressData ?? 0);
    if (Number.isInteger(progress) && progress >= 0 && progress < levels.length) levelIndex = progress;
  } catch { /* Ignore corrupt saves. */ }
  try {
    const savedGold = await platform.loadData(Config.goldKey);
    const balance = Number(savedGold);
    if (savedGold !== null && Number.isSafeInteger(balance) && balance >= 0) gold = balance;
  } catch { /* Use the starting balance for an unreadable wallet. */ }
  const wallet = CoinWallet.restore(await platform.loadData(Config.walletKey), gold, cratePickerCount);
  cratePickerCount = wallet.inventory.cratePicker ?? cratePickerCount;
  let walletSave = Promise.resolve();
  function saveWallet() {
    wallet.inventory.cratePicker = cratePickerCount;
    const snapshot = wallet.serialize();
    walletSave = walletSave.catch(() => {}).then(() => platform.saveData(Config.walletKey, snapshot));
    return walletSave;
  }
  await saveWallet();
  const savedSpeed = await platform.loadData(Config.speedKey);
  const remainingSpeed = savedSpeed === null ? 300_000 : Number(savedSpeed);
  const speed = new SpeedBoost(Number.isFinite(remainingSpeed) && remainingSpeed >= 0 ? remainingSpeed : 300_000);
  let speedCheckpoint = 0;
  let speedSave = Promise.resolve();
  function saveSpeed() {
    const value = String(speed.remainingMs);
    speedSave = speedSave.catch(() => {}).then(() => platform.saveData(Config.speedKey, value));
  }
  const requestedLevel = Number(new URLSearchParams(location.search).get('level'));
  const requestedIndex = levels.findIndex(level => level.id === requestedLevel);
  if (requestedIndex >= 0) levelIndex = requestedIndex;

  const atlas = createAtlas(app);
  const logoTexture = await Assets.load(logoUrl);
  const floor = new Graphics();
  const scene = new Container();
  const header = new Container();
  const content = new Container();
  const controls = new Container();
  const modal = new Container();
  const settingsPanel = new SettingsPanel(toggleSettings, toggleSound, toggleMusic, toggleHaptics,
    { replay: () => requestSettingsAction('replay'), home: () => requestSettingsAction('home') });
  settingsPanel.visible = false;
  scene.addChild(header, content, controls, modal, settingsPanel);
  const developmentLevelPanel = new Container();
  let developmentLevelsButton: Container | null = null;
  developmentLevelPanel.visible = false;
  if (import.meta.env.DEV && __PLATFORM__ === 'local' && Config.development.levelPicker) {
    scene.addChild(developmentLevelPanel);
    const backdrop = new Graphics().rect(0, 0, 1080, 1920).fill({ color: '#173d35', alpha: 0.6 });
    backdrop.eventMode = 'static';
    developmentLevelPanel.addChild(backdrop,
      new Graphics().roundRect(120, 340, 840, 1240, 55).fill('#fff8de'));
    text(developmentLevelPanel, 'Choose a level', 540, 460, 52, '#36582b');
    text(developmentLevelPanel, 'Development', 540, 535, 28, '#74633a');
    button(developmentLevelPanel, '×', 900, 390, 100, closeDevelopmentLevels, '#ed476c');
    levels.forEach((level, index) => {
      button(developmentLevelPanel, String(level.id), 240 + index % 6 * 120,
        680 + Math.floor(index / 6) * 145, 100, () => {
          closeDevelopmentLevels();
          gesture();
          startLevel(index);
        }, '#6381b5');
    });
    developmentLevelsButton = button(controls, 'Levels', 110, 1840, 150, () => {
      if (adBlocked || featureOpen || pickerActive || vacuumUi || settingsOpen || pendingLevel !== null) return;
      developmentLevelPanel.visible = true;
      audio.pause();
      platform.gameplayStop();
      content.eventMode = 'none';
    }, '#6381b5').item;
  }

  function closeDevelopmentLevels() {
    developmentLevelPanel.visible = false;
    content.eventMode = settingsOpen || model.state !== 'Playing' ? 'none' : 'passive';
    if (started && !settingsOpen && model.state === 'Playing') { gesture(); platform.gameplayStart(); }
  }
  app.stage.addChild(floor, scene);
  const levelLabel = text(header, '', 540, 110, 42);
  levelLabel.style.fontFamily = 'Arial, Helvetica, sans-serif';
  levelLabel.style.fontWeight = '800';
  const counter = text(header, '', 440, 170, 34);
  const coinHud = new Container();
  let displayedCoins = wallet.balance;
  let activeWinScreen: WinScreen | null = null;
  coinHud.addChild(new Graphics().roundRect(75, 69, 260, 82, 41).fill({ color: '#226d83', alpha: 0.75 }),
    coinIcon(90, 108, 40));
  const coinBalance = text(coinHud, '', 222, 110, 36, '#ffffff');
  const progressBar = new Graphics();
  header.addChild(progressBar);
  settingsGear(header, 1000, 110, toggleSettings);
  const speedButton = new SpeedButton(() => {
    if (adBlocked || settingsOpen || featureOpen || pickerActive || vacuumUi || model.state !== 'Playing') return;
    if (speed.remainingMs <= 0) { openSpeedShop(); return; }
    gesture(); speed.toggle(); saveSpeed();
  });
  header.addChild(speedButton);
  const guide = text(controls, '', 540, 1470, 30, '#526e65');
  guide.visible = false;
  // The queue feeds upward from behind the bottom powerup panel.
  controls.addChild(new Graphics()
    .roundRect(0, 1790, Config.designWidth, Config.designHeight - 1790 + 40, 40).fill('#526ca5')
    .roundRect(0, 1797, Config.designWidth, Config.designHeight - 1797 + 40, 40).fill('#6381b5')
    .rect(0, 1890, Config.designWidth, 30).fill({ color: '#526ca5', alpha: 0.25 }));
  const pickerPowerup = new BoosterButton('cratePicker', 330, () => tapBooster('cratePicker', activateCratePicker));
  controls.addChild(pickerPowerup);
  const shufflePowerup = new BoosterButton('shuffle', 540, () => tapBooster('shuffle', useShuffle));
  const vacuumPowerup = new BoosterButton('bigVacuum', 750, () => tapBooster('bigVacuum', activateVacuum));
  controls.addChild(shufflePowerup, vacuumPowerup);
  if (developmentLevelsButton) controls.setChildIndex(developmentLevelsButton, controls.children.length - 1);
  const botLayer = new Container();
  const botPool = new Pool(() => new BotView(atlas));
  const botViews = new Map<number, BotView>();
  const crateTweens = new CrateTweens();
  const laneViews = new Map<CrateData, CrateView>();
  const pendingDockSounds = new Set<string>();
  const departingCrates = new Map<number, { x: number; y: number }>();
  let model: GameModel;
  let board: BoardView;
  let puffs: Puffs;
  let docks: Container | null = null;
  let lanes: Container | null = null;
  let dockSignature = '';
  let featureOpen = false;
  let boosterGuide: BoosterGuide | null = null;
  let guidedBooster: 'cratePicker' | 'shuffle' | 'bigVacuum' | null = null;
  let connectedFeatureClaimed = false;
  let mysteryFeatureClaimed = false;
  let settingsOpen = false;
  let started = false;
  let pickerActive = false;
  let vacuumUi: Container | null = null;
  let pickerTutorialRequired = false;
  let pickerDepthStart = 1;
  let pickerCameraTarget = 0;
  let pickerUi: Container | null = null;
  let hintOverride = '';
  let hintMs = 0;
  let unsubscribe = () => {};
  let lastCommercial = -Infinity;
  const baseHitAreas = new WeakMap<Container, Rectangle>();
  let menuOpen = false;
  const mainMenu = new MainMenu(logoTexture, playFromMenu, toggleSound, toggleMusic, toggleHaptics);
  mainMenu.visible = false;
  scene.addChild(mainMenu);
  scene.addChild(coinHud);

  function refreshMainMenu() {
    const nextIndex = hasStartedLevel && model.state === 'Won' ? Math.min(levelIndex + 1, levels.length - 1) : levelIndex;
    mainMenu.refresh(levels[nextIndex].id, savedProgress || hasStartedLevel, audio.enabled, wallet.balance, audio.musicEnabled, hapticsEnabled);
  }

  function showMainMenu() {
    if (adBlocked || pendingLevel !== null) return;
    speed.reset(); saveSpeed();
    menuOpen = true;
    settingsOpen = false;
    settingsPanel.visible = false;
    header.visible = content.visible = controls.visible = modal.visible = false;
    mainMenu.visible = true;
    coinHud.visible = false;
    mainMenu.showSettings(false);
    refreshMainMenu();
    audio.pause();
    platform.gameplayStop();
    app.canvas.dataset.state = 'Main menu';
    status.textContent = 'Tiny Sweepers main menu. Press Enter to play or continue.';
  }

  function playFromMenu() {
    if (adBlocked) return;
    menuOpen = false;
    mainMenu.visible = false;
    coinHud.visible = true;
    header.visible = content.visible = controls.visible = modal.visible = true;
    gesture();
    if (!hasStartedLevel || model.state !== 'Playing') {
      startLevel(hasStartedLevel && model.state === 'Won' ? Math.min(levelIndex + 1, levels.length - 1) : levelIndex);
    } else {
      content.eventMode = featureOpen || pickerActive ? 'none' : 'passive';
      if (started && !featureOpen && !pickerActive) platform.gameplayStart();
    }
  }

  function toggleSettings() {
    if (featureOpen || pickerActive || vacuumUi) return;
    if (adBlocked) return;
    settingsPanel.dismissConfirmation();
    settingsOpen = !settingsOpen;
    settingsPanel.visible = settingsOpen;
    content.eventMode = settingsOpen || model.state !== 'Playing' ? 'none' : 'passive';
    if (settingsOpen) { saveSpeed(); audio.pause(); platform.gameplayStop(); }
    else if (started && model.state === 'Playing') { gesture(); platform.gameplayStart(); }
  }

  function requestSettingsAction(action: 'replay' | 'home') {
    if (action === 'replay' && activeWinScreen && !activeWinScreen.ready) return;
    if (adBlocked || featureOpen || pickerActive || vacuumUi || pendingLevel !== null) return;
    if (!settingsOpen) toggleSettings();
    settingsPanel.confirm(action, () => {
      if (action === 'home') showMainMenu();
      else { toggleSettings(); restart(); }
    });
  }

  function saveSettings() {
    void platform.saveData(Config.settingsKey, JSON.stringify({ sound: audio.enabled, music: audio.musicEnabled, haptics: hapticsEnabled }));
    settingsPanel.refresh(audio.enabled, audio.musicEnabled, hapticsEnabled);
    app.canvas.dataset.sound = String(audio.enabled);
    app.canvas.dataset.music = String(audio.musicEnabled);
    app.canvas.dataset.haptics = String(hapticsEnabled);
    if (menuOpen) refreshMainMenu();
    drawPickerPowerup();
  }
  function drawPickerPowerup() {
    pickerPowerup.refresh(levelIndex + 1, Config.cratePickerUnlockLevel, cratePickerCount);
  }
  function gesture() { audio.unlock(); }

  function guideBooster(kind: 'cratePicker' | 'shuffle' | 'bigVacuum') {
    clear(modal);
    featureOpen = true;
    content.eventMode = 'none';
    platform.gameplayStop();
    guidedBooster = kind;
    const control = kind === 'cratePicker' ? pickerPowerup : kind === 'shuffle' ? shufflePowerup : vacuumPowerup;
    boosterGuide = new BoosterGuide(control.x, control.label);
    modal.addChild(boosterGuide);
  }
  function tapBooster(kind: 'cratePicker' | 'shuffle' | 'bigVacuum', action: () => void) {
    if (adBlocked || (guidedBooster && guidedBooster !== kind)) return;
    if (guidedBooster === kind) {
      clear(modal); boosterGuide = null; guidedBooster = null;
      featureOpen = false; content.eventMode = 'passive';
    }
    if (featureOpen || settingsOpen || pickerActive || vacuumUi || model.state !== 'Playing') return;
    const unlock = kind === 'cratePicker' ? Config.cratePickerUnlockLevel : kind === 'shuffle'
      ? Config.shuffleUnlockLevel : Config.bigVacuumUnlockLevel;
    if (levelIndex + 1 < unlock) return;
    const count = kind === 'cratePicker' ? cratePickerCount : wallet.inventory[kind] ?? 0;
    if (count === 0) { openBoosterShop(kind); return; }
    action();
  }

  function openSpeedShop() {
    gesture(); saveSpeed(); platform.gameplayStop();
    featureOpen = true; content.eventMode = 'none';
    const close = () => {
      if (adBlocked) return;
      clear(modal); featureOpen = false; content.eventMode = 'passive';
      app.canvas.dataset.state = model.state;
      if (started && model.state === 'Playing') platform.gameplayStart();
    };
    modal.addChild(new SpeedShop(wallet.balance, (minutes, price) => {
      if (!featureOpen || adBlocked || !wallet.spend(price)) return;
      speed.remainingMs += minutes * 60_000;
      speed.active = true;
      displayedCoins = wallet.balance;
      void saveWallet(); void saveSpeed(); audio.pop();
      close(); sync();
    }, close, () => { void watchSpeedAd(); }, platform.canShowRewardedAd()));
    app.canvas.dataset.state = 'Speed shop';

    async function watchSpeedAd() {
      if (adBlocked || !featureOpen || !platform.canShowRewardedAd()) return;
      const completed = await platform.rewardedBreak();
      if (completed) {
        speed.remainingMs += 180_000;
        speed.active = true;
        void saveSpeed();
      }
      close(); sync();
    }
  }

  function openBoosterShop(kind: BoosterKind) {
    gesture(); saveSpeed(); platform.gameplayStop();
    featureOpen = true; content.eventMode = 'none';
    const close = () => {
      clear(modal); featureOpen = false; content.eventMode = 'passive';
      if (started && model.state === 'Playing') platform.gameplayStart();
    };
    modal.addChild(new BoosterShop(kind, wallet.balance, () => {
      if (adBlocked || !wallet.buyPowerup(kind, boosterPrices[kind])) return;
      if (kind === 'cratePicker') cratePickerCount = wallet.inventory.cratePicker;
      displayedCoins = wallet.balance;
      void saveWallet(); drawPickerPowerup(); refreshNewBoosters(); audio.pop();
      close(); sync();
    }, close));
  }

  function refreshNewBoosters() {
    shufflePowerup.refresh(levelIndex + 1, Config.shuffleUnlockLevel, wallet.inventory.shuffle ?? 0);
    vacuumPowerup.refresh(levelIndex + 1, Config.bigVacuumUnlockLevel, wallet.inventory.bigVacuum ?? 0);
  }
  function boosterAvailable(kind: 'shuffle' | 'bigVacuum', unlock: number) {
    if (levelIndex + 1 < unlock || settingsOpen || adBlocked || featureOpen || pickerActive
      || vacuumUi || model.state !== 'Playing') return false;
    if ((wallet.inventory[kind] ?? 0) > 0) return true;
    hintOverride = 'No boosters left. Try again with your crates.'; hintMs = 2200;
    return false;
  }
  function useShuffle() {
    if (!boosterAvailable('shuffle', Config.shuffleUnlockLevel)) return;
    gesture();
    if (!model.shuffleCrates()) {
      hintOverride = 'Shuffle needs a free dock and a reachable matching color.'; hintMs = 2200;
      return;
    }
    wallet.inventory.shuffle--;
    void saveWallet(); refreshNewBoosters(); drawLanes(); sync(); audio.pop(); vibrate(25);
    hintOverride = 'A matching crate is now at the front!'; hintMs = 2200;
  }
  function closeVacuum() {
    if (!vacuumUi) return;
    // Restore the live board before destroying the temporary selection layer.
    content.addChildAt(board, 0);
    board.position.set(Config.layout.boardX, Config.layout.boardY);
    board.scale.set(1);
    modal.removeChild(vacuumUi); vacuumUi.destroy({ children: true }); vacuumUi = null;
    if (started && model.state === 'Playing') platform.gameplayStart();
  }
  function activateVacuum() {
    if (!boosterAvailable('bigVacuum', Config.bigVacuumUnlockLevel)) return;
    gesture(); platform.gameplayStop();
    vacuumUi = new Container();
    modal.addChild(vacuumUi);
    const shade = new Graphics().rect(0, 0, Config.designWidth, Config.designHeight)
      .fill({ color: '#173d35', alpha: 0.65 });
    shade.eventMode = 'static';
    vacuumUi.addChild(shade);
    const zoom = 1.2;
    board.position.set((Config.designWidth - Config.layout.boardSize * zoom) / 2, 430);
    board.scale.set(zoom);
    vacuumUi.addChild(board);
    const target = new Graphics().rect(0, 0, Config.layout.boardSize, Config.layout.boardHeight)
      .fill({ color: '#ffffff', alpha: 0.01 });
    target.scale.set(zoom);
    target.position.set(board.x, board.y); target.eventMode = 'static'; target.cursor = 'crosshair';
    target.on('pointertap', event => {
      if (adBlocked || settingsOpen) return;
      const point = target.toLocal(event.global);
      const x = Math.floor(point.x / board.cellSize); const y = Math.floor(point.y / board.cellSize);
      if (x < 0 || x >= model.level.width || y < 0 || y >= model.level.height) return;
      const cell = y * model.level.width + x;
      if (model.board.cells[cell] < 0) return;
      const color = model.board.cells[cell];
      const position = board.cellPosition(cell);
      closeVacuum();
      wallet.inventory.bigVacuum--;
      void saveWallet(); refreshNewBoosters();
      model.vacuumColor(cell);
      puffs.burst(board.x + position.x, board.y + position.y, 2, model.level.palette[color], true);
      drawLanes(); sync(); audio.pop(); vibrate([20, 25, 40]);
    });
    vacuumUi.addChild(target);
    const title = text(vacuumUi, 'Tap a block to vacuum its entire color', 540, 315, 35, '#fff8de');
    title.style.fontFamily = 'Trebuchet MS, sans-serif';
    button(vacuumUi, 'Cancel', 540, 1350, 250, closeVacuum, '#6381b5');
  }
  function toggleSound() {
    if (adBlocked) return;
    audio.enabled = !audio.enabled;
    audio.pause();
    gesture();
    if (audio.enabled) audio.tone(620, 0.12);
    saveSettings();
  }
  function toggleMusic() {
    if (adBlocked) return;
    audio.musicEnabled = !audio.musicEnabled;
    audio.pause();
    gesture();
    saveSettings();
  }
  function vibrate(pattern: number | number[]) {
    if (!hapticsEnabled || adBlocked || document.hidden) return;
    try { navigator.vibrate?.(pattern); } catch { /* Unsupported devices stay silent. */ }
  }
  function toggleHaptics() {
    if (adBlocked) return;
    hapticsEnabled = !hapticsEnabled;
    if (hapticsEnabled) vibrate(20);
    else { try { navigator.vibrate?.(0); } catch { /* Optional device support. */ } }
    saveSettings();
  }
  function clear(container: Container) {
    for (const child of container.removeChildren()) child.destroy({ children: true });
  }

  let pendingLevel: number | null = null;
  let loadingElapsed = 0;
  let loadingScreen: Container | null = null;
  let loadingBackground: Graphics | null = null;
  let resultBackdrop: Graphics | null = null;
  let loadingRobot: Sprite | null = null;
  function resizeLoadingBackground() {
    if (!loadingBackground) return;
    const { width, height } = app.screen;
    loadingBackground.clear().rect(-scene.x / scene.scale.x, -scene.y / scene.scale.y,
      width / scene.scale.x, height / scene.scale.y).fill('#0754c4');
  }
  function resizeResultBackdrop() {
    if (!resultBackdrop) return;
    const { width, height } = app.screen;
    resultBackdrop.clear().rect(-scene.x / scene.scale.x, -scene.y / scene.scale.y,
      width / scene.scale.x, height / scene.scale.y).fill({ color: '#19243c', alpha: 0.72 });
  }
  let hasStartedLevel = false;
  let tutorial: TutorialView | null = null;
  function startLevel(index: number) {
    if (!hasStartedLevel) {
      hasStartedLevel = true;
      buildLevel(index);
      return;
    }
    if (pendingLevel !== null) return;
    pendingLevel = index;
    loadingElapsed = 0;
    platform.gameplayStop();
    scene.eventMode = 'none';
    loadingScreen = new Container();
    loadingBackground = new Graphics();
    loadingScreen.addChild(loadingBackground);
    resizeLoadingBackground();
    const logo = new Sprite(logoTexture);
    logo.anchor.set(0.5);
    logo.position.set(540, 650);
    const logoScale = 560 / Math.max(logoTexture.width, logoTexture.height);
    logo.scale.set(logoScale);
    loadingScreen.addChild(logo);
    loadingRobot = new Sprite(atlas.botFace);
    loadingRobot.anchor.set(0.5);
    loadingRobot.position.set(540, 1040);
    loadingRobot.width = loadingRobot.height = 100;
    loadingRobot.tint = '#18bfa9';
    loadingScreen.addChild(loadingRobot);
    text(loadingScreen, `Level ${levels[index].id}`, 540, 1160, 54, '#ffffff');
    text(loadingScreen, 'Getting ready to sweep…', 540, 1240, 32, '#d5f2ff');
    scene.addChild(loadingScreen);
  }
  function buildLevel(index: number) {
    speed.reset(); saveSpeed();
    activeWinScreen = null;
    displayedCoins = wallet.balance;
    wallet.beginAttempt();
    tutorial?.destroy({ children: true });
    tutorial = null;
    crateTweens.clear();
    pendingDockSounds.clear();
    laneViews.clear();
    departingCrates.clear();
    platform.gameplayStop();
    unsubscribe();
    botViews.forEach(view => { botLayer.removeChild(view); botPool.release(view); });
    botViews.clear();
    if (botLayer.parent) content.removeChild(botLayer);
    clear(content);
    clear(modal);
    resultBackdrop = null;
    pickerUi = null;
    vacuumUi = null;
    pickerActive = false;
    pickerCameraTarget = 0;
    content.y = 0;
    content.eventMode = 'passive';
    docks = lanes = null;
    dockSignature = '';
    started = settingsOpen = false;
    featureOpen = false;
    boosterGuide = null;
    guidedBooster = null;
    settingsPanel.visible = false;
    hintOverride = '';
    hintMs = 0;
    levelIndex = index;
    void platform.saveData(Config.progressKey, String(index));
    const boosterTutorial = levels[index].id === Config.cratePickerUnlockLevel;
    pickerTutorialRequired = boosterTutorial;
    if (boosterTutorial) {
      cratePickerCount++;
      void saveWallet();
    }
    model = new GameModel(boosterTutorial ? boosterTutorialLevel(levels[index]) : levels[index]);
    let newBooster: 'shuffle' | 'bigVacuum' | null = null;
    for (const [kind, unlock] of [['shuffle', Config.shuffleUnlockLevel], ['bigVacuum', Config.bigVacuumUnlockLevel]] as const) {
      if (index + 1 >= unlock && !wallet.inventory[`${kind}Unlocked`]) {
        wallet.inventory[`${kind}Unlocked`] = 1;
        wallet.inventory[kind] = (wallet.inventory[kind] ?? 0) + 1;
        if (index + 1 === unlock) newBooster = kind;
        void saveWallet();
      }
      // Replaying an introduction level always offers its guided practice.
      if (index + 1 === unlock) {
        newBooster = kind;
        if (!(wallet.inventory[kind] > 0)) {
          wallet.inventory[kind] = 1;
          void saveWallet();
        }
      }
    }
    refreshNewBoosters();
    board = new BoardView(model);
    content.addChild(board);
    content.addChild(new Graphics().roundRect(Config.layout.binX - 60, Config.layout.binY - 60, 120, 120, 8).fill('#58a99a')
      .roundRect(Config.layout.binX - 46, Config.layout.binY - 46, 92, 92, 4).fill('#176f68'));
    text(content, 'DUSTBIN', Config.layout.binX, Config.layout.binY + 90, 36, '#71817a');
    puffs = new Puffs();
    content.addChild(botLayer, puffs);
    levelLabel.text = `Level ${index + 1}`;
    if (model.level.id === 1) {
      tutorial = new TutorialView();
      controls.addChild(tutorial);
      tutorial.update(model, 0);
    }
    drawLanes();
    unsubscribe = model.events.on(event => {
      if (event.type === 'placed') {
        vibrate(15);
        tutorial?.placed();
        audio.tone(220, 0.08);
        const removed = [...laneViews].filter(([crate]) => !model.dockModel.lanes.some(lane => lane.includes(crate)));
        event.placements.forEach((placement, i) => {
          const view = removed[i]?.[1];
          if (view) departingCrates.set(model.dockModel.docks[placement.dock]!.id, { x: view.x, y: view.y });
        });
        drawLanes();
      }
      else if (event.type === 'collected') {
        const position = board.cellPosition(event.cell);
        puffs.burst(board.x + position.x, board.y + position.y, 0.7, model.level.palette[event.color], true);
        audio.pickup();
      }
      else if (event.type === 'delivered') {
        puffs.burst(Config.layout.binX, Config.layout.binY);
      } else {
        speed.reset(); saveSpeed();
        platform.gameplayStop();
        if (event.state === 'Won') {
          audio.win();
          vibrate([30, 40, 60]);
          displayedCoins = wallet.balance;
          if (wallet.awardWin()) void saveWallet();
          void platform.saveData(Config.progressKey, String(Math.min(index + 1, levels.length - 1)));
        }
        showResult();
      }
    });
    saveSettings();
    sync();
    if (newBooster) {
      const kind = newBooster;
      featureOpen = true; content.eventMode = 'none';
      modal.addChild(new NewBoosterUnlock(kind, () => {
        gesture(); guideBooster(kind);
      }));
    }
    if (boosterTutorial) {
      featureOpen = true;
      content.eventMode = 'none';
      modal.addChild(new BoosterUnlock(() => {
        gesture();
        guideBooster('cratePicker');
      }));
    }
    if (model.level.id === 14 && !connectedFeatureClaimed) {
      featureOpen = true;
      content.eventMode = 'none';
      modal.addChild(new FeatureUnlock(() => {
        gesture();
        connectedFeatureClaimed = true;
        featureOpen = false;
        clear(modal);
        content.eventMode = 'passive';
      }));
    }
    if (model.level.id === 26 && !mysteryFeatureClaimed) {
      featureOpen = true;
      content.eventMode = 'none';
      modal.addChild(new FeatureUnlock(() => {
        gesture();
        mysteryFeatureClaimed = true;
        featureOpen = false;
        clear(modal);
        content.eventMode = 'passive';
      }, 'mystery'));
    }
  }

  function maxBuriedDepth() {
    return Math.max(0, ...model.dockModel.lanes.map(lane => lane.length - 1));
  }
  function updatePickerCamera() {
    pickerCameraTarget = 430 - (Config.layout.laneY - 35
      + pickerDepthStart * Config.layout.laneRowSpacing);
  }
  function drawPickerUi() {
    if (!pickerUi) return;
    for (const child of pickerUi.removeChildren()) child.destroy({ children: true });
    pickerUi.addChild(new Graphics().roundRect(130, 42, 820, 155, 38)
      .fill({ color: '#17243a', alpha: 0.94 }).stroke({ color: '#7ce8d2', width: 5 }));
    text(pickerUi, 'Choose one buried crate', 540, 92, 42, '#ffffff');
    text(pickerUi, pickerTutorialRequired ? 'Choose a green crate to begin sweeping' : 'Tap any buried crate below', 540, 147, 29, '#bfeee5');
    button(pickerUi, 'CANCEL', 930, 255, 220, () => closeCratePicker(), '#6c7180');
    const earlier = button(pickerUi, '▲ EARLIER', 180, 1620, 290, () => {
      pickerDepthStart = Math.max(1, pickerDepthStart - 7);
      updatePickerCamera();
      drawPickerUi();
    }, '#365f72');
    const deepestStart = Math.max(1, maxBuriedDepth() - 6);
    const deeper = button(pickerUi, 'DEEPER ▼', 900, 1620, 290, () => {
      pickerDepthStart = Math.min(deepestStart, pickerDepthStart + 7);
      updatePickerCamera();
      drawPickerUi();
    }, '#365f72');
    earlier.item.alpha = pickerDepthStart > 1 ? 1 : 0.35;
    earlier.item.eventMode = pickerDepthStart > 1 ? 'static' : 'none';
    deeper.item.alpha = pickerDepthStart < deepestStart ? 1 : 0.35;
    deeper.item.eventMode = pickerDepthStart < deepestStart ? 'static' : 'none';
  }
  function activateCratePicker() {
    if (levelIndex + 1 < Config.cratePickerUnlockLevel || cratePickerCount <= 0 || pickerActive || vacuumUi
      || settingsOpen || adBlocked || featureOpen || model.state !== 'Playing') return;
    if (model.dockModel.full || maxBuriedDepth() === 0) {
      hintOverride = model.dockModel.full ? 'The powerup needs a free dock.' : 'There are no buried crates left.';
      hintMs = 1800;
      sync();
      return;
    }
    gesture();
    pickerActive = true;
    pickerDepthStart = 1;
    updatePickerCamera();
    platform.gameplayStop();
    pickerUi = new Container();
    modal.addChild(pickerUi);
    drawPickerUi();
    drawLanes();
  }
  function closeCratePicker(used = false) {
    if (!pickerActive) return;
    pickerActive = false;
    pickerCameraTarget = 0;
    if (pickerUi) {
      modal.removeChild(pickerUi);
      pickerUi.destroy({ children: true });
      pickerUi = null;
    }
    if (used) {
      pickerTutorialRequired = false;
      cratePickerCount--;
      saveSettings();
      void saveWallet();
      audio.pop();
      started = true;
    }
    drawLanes();
    if (started && model.state === 'Playing') platform.gameplayStart();
  }
  function chooseBuriedCrate(lane: number, depth: number) {
    if (!pickerActive || model.dockModel.full || !model.dockModel.lanes[lane]?.[depth]) return;
    gesture();
    closeCratePicker(true);
    model.placeBuriedCrate(lane, depth);
  }

  function drawLanes() {
    const previous = new Map(laneViews);
    laneViews.clear();
    for (const view of previous.values()) view.parent?.removeChild(view);
    if (lanes) { content.removeChild(lanes); lanes.destroy({ children: true }); }
    const laneGroup = new Container();
    lanes = laneGroup;
    model.dockModel.lanes.forEach((lane, laneIndex) => {
      const x = (Config.designWidth - (model.level.lanes.length - 1) * Config.layout.laneSpacing) / 2
        + laneIndex * Config.layout.laneSpacing;
      const shown = lane;
      for (let depth = 0; depth < shown.length; depth++) {
        const old = previous.get(shown[depth]);
        const selectable = pickerActive ? depth > 0 : depth === 0;
        const view = new CrateView(shown[depth], model.level.palette, atlas,
          selectable ? () => pickerActive ? chooseBuriedCrate(laneIndex, depth) : place(laneIndex) : undefined,
          pickerActive ? depth > 0 : depth === 0);
        view.scale.set(pickerActive && depth > 0 ? 1.06 : 1);
        view.position.set(x, Config.layout.laneY - 35 + depth * Config.layout.laneRowSpacing);
        view.alpha = pickerActive ? depth === 0 ? 0.45 : 1 : depth === 0 ? 1 : 0.85;
        if (old) {
          const targetY = view.y;
          view.position.copyFrom(old.position);
          view.alpha = old.alpha;
          crateTweens.move(view, x, targetY, pickerActive && depth > 0 ? 1.06 : 1,
            pickerActive ? depth === 0 ? 0.45 : 1 : depth === 0 ? 1 : 0.85);
          old.destroy({ children: true });
          previous.delete(shown[depth]);
        }
        laneViews.set(shown[depth], view);
        laneGroup.addChild(view);
      }
    });
    content.addChild(lanes);
    drawConnections(lanes);
    for (const view of previous.values()) {
      content.addChild(view);
      crateTweens.move(view, view.x, view.y - 15, 0.7, 0, true);
    }
    content.setChildIndex(puffs, content.children.length - 1);
  }

  function place(lane: number) {
    if (featureOpen || pickerActive || vacuumUi) return;
    if (pickerTutorialRequired) { activateCratePicker(); return; }
    if (settingsOpen || adBlocked || document.hidden || model.state !== 'Playing') return;
    gesture();
    if (model.placeCrate(lane)) { started = true; if (model.state === 'Playing') platform.gameplayStart(); }
    else if (model.dockModel.full) { hintOverride = 'All docks are busy. Let the bots finish.'; hintMs = 1800; }
    else if (model.dockModel.peek(lane)?.pairId) {
      hintOverride = model.dockModel.placementLanes(lane).length === 0
        ? 'Bring both connected boxes to the front first.' : 'Connected boxes need two free docks.';
      hintMs = 1800;
    }
    sync();
  }
  function restart() { if (!adBlocked && (!activeWinScreen || activeWinScreen.ready)) { gesture(); startLevel(levelIndex); } }
  async function next() {
    if (activeWinScreen && !activeWinScreen.ready) return;
    if (adBlocked) return;
    gesture();
    if (model.state !== 'Won') return;
    if (levelIndex + 1 >= Config.ads.firstCommercialAfterLevel && performance.now() - lastCommercial >= Config.ads.cooldownMs) {
      lastCommercial = performance.now();
      await platform.commercialBreak();
    }
    startLevel((levelIndex + 1) % levels.length);
  }
  function showResult() {
    clear(modal);
    resultBackdrop = new Graphics();
    modal.addChild(resultBackdrop);
    resizeResultBackdrop();
    const won = model.state === 'Won';
    if (won) {
      activeWinScreen = new WinScreen(model.level.id, levelIndex === levels.length - 1, next, async () => {
        const screen = activeWinScreen;
        gesture();
        const completed = await platform.rewardedBreak();
        if (screen !== activeWinScreen || model.state !== 'Won') return false;
        if (!wallet.doubleWinReward(completed)) return false;
        void saveWallet();
        return true;
      }, () => {
        displayedCoins = Math.min(wallet.balance, displayedCoins + 5);
        audio.tone(850 + (displayedCoins % 50) * 8, 0.05);
      }, platform.canShowRewardedAd());
      modal.addChild(activeWinScreen);
      content.eventMode = 'none';
      return;
    }
    const total = model.level.pixels.filter(color => color >= 0).length;
    modal.addChild(new LoseScreen(model.level.id, total - model.board.remaining, total, restart));
    content.eventMode = 'none';
  }

  function sync() {
    board.sync();
    const signature = model.dockModel.docks.map(crate => crate ? `${crate.id}:${crate.atDock}:${model.board.canClaim(crate.color)}` : '-').join('|');
    if (signature !== dockSignature) {
      const oldCrates = new Map<string, CrateView>();
      for (const dock of docks?.children ?? []) {
        if (dock instanceof Container) for (const child of dock.children) {
          if (child instanceof CrateView) {
            oldCrates.set(child.label, child);
            child.position.set(child.x + dock.x, child.y + dock.y);
            dock.removeChild(child);
          }
        }
      }
      if (docks) { content.removeChild(docks); docks.destroy({ children: true }); }
      docks = drawDocks(content, model, atlas, side => {
        if (settingsOpen || adBlocked || featureOpen || model.state !== 'Playing') return;
        gesture();
        if (model.dockModel.unlockBonus(side)) { audio.pop(); sync(); }
      });
      for (const dock of docks.children) {
        if (dock instanceof Container) for (const child of dock.children) {
          if (!(child instanceof CrateView)) continue;
          const old = oldCrates.get(child.label);
          const origin = departingCrates.get(Number(child.label.replace('dock-crate-', '')));
          if (origin) pendingDockSounds.add(child.label);
          if (old || origin) {
            child.position.set((old?.x ?? origin!.x) - dock.x, (old?.y ?? origin!.y) - dock.y);
            child.scale.set(old?.scale.x ?? 1);
            crateTweens.move(child, 0, 0, 1, 1, false, () => {
              if (pendingDockSounds.delete(child.label)) audio.pop();
            });
          }
          if (old) { old.destroy({ children: true }); oldCrates.delete(child.label); }
        }
      }
      departingCrates.clear();
      for (const view of oldCrates.values()) {
        content.addChild(view);
        crateTweens.move(view, view.x, view.y - 12, 0.5, 0, true);
      }
      content.setChildIndex(puffs, content.children.length - 1);
      dockSignature = signature;
    }
    for (const [id, view] of botViews) {
      if (!model.bots.has(id)) { botLayer.removeChild(view); botPool.release(view); botViews.delete(id); }
    }
    for (const bot of model.bots.values()) {
      let view = botViews.get(bot.id);
      if (!view) { view = botPool.take(); botViews.set(bot.id, view); botLayer.addChild(view); }
      view.sync(bot, model, board);
    }
    const total = model.level.pixels.filter(color => color >= 0).length;
    const cleaned = total - model.board.remaining;
    counter.text = `${cleaned} / ${total} cubes cleaned`;
    coinBalance.text = displayedCoins.toLocaleString();
    coinBalance.scale.set(1);
    coinBalance.scale.set(Math.min(1, 175 / coinBalance.width));
    app.canvas.dataset.coins = String(wallet.balance);
    progressBar.clear().roundRect(140, 200, 800, 13, 6).fill('#d9dbc9');
    if (cleaned > 0) progressBar.roundRect(140, 200, 800 * cleaned / total, 13, 6).fill('#18bfa9');
    const waiting = model.dockModel.docks.filter(crate => crate && crate.unassigned > 0 && !model.board.canClaim(crate.color)).length;
    guide.text = pickerActive ? 'Choose any mystery crate · the powerup sends it to a free dock'
      : model.state === 'Won' ? 'Room complete — nice work!'
      : model.state === 'Lost' ? 'Retry and leave room for the outer colors'
        : hintMs > 0 ? hintOverride : waiting > 0 ? 'Waiting bots need their color exposed'
          : started ? 'Match the exposed dust. Keep a dock free.' : 'Tap a top crate to send its sweepers';
    const occupied = model.dockModel.docks.filter(crate => crate !== null).length;
    app.canvas.dataset.level = String(levelIndex + 1);
    app.canvas.dataset.state = adBlocked ? 'Ad break' : settingsOpen ? 'Settings' : model.state;
    app.canvas.dataset.remaining = String(model.board.remaining);
    app.canvas.dataset.docks = String(occupied);
    const summary = `Level ${levelIndex + 1}. ${adBlocked ? 'Ad break' : settingsOpen ? 'Settings' : model.state}. ${model.board.remaining} cubes remaining. ${occupied} of ${model.dockModel.docks.length} docks occupied.`;
    if (status.textContent !== summary) status.textContent = summary;
  }

  const safeAreaProbe = document.createElement('div');
  safeAreaProbe.className = 'safe-area-probe';
  safeAreaProbe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(safeAreaProbe);
  function resize() {
    app.resize();
    app.renderer.resolution = Math.min(window.devicePixelRatio || 1, Config.maxResolution);
    const { width, height } = app.screen;
    const padding = getComputedStyle(safeAreaProbe);
    const layout = fitPlayArea(width, height, {
      top: parseFloat(padding.paddingTop) || 0, right: parseFloat(padding.paddingRight) || 0,
      bottom: parseFloat(padding.paddingBottom) || 0, left: parseFloat(padding.paddingLeft) || 0,
    });
    scene.scale.set(layout.scale);
    scene.position.set(layout.x, layout.y);
    resizeLoadingBackground();
    resizeResultBackdrop();
    // Keep small-height desktop windows usable with a minimum CSS tap area.
    const minHit = Config.minTapTarget / layout.scale;
    function expandTargets(node: Container) {
      if (node.hitArea instanceof Rectangle) {
        const area = baseHitAreas.get(node) ?? node.hitArea.clone();
        baseHitAreas.set(node, area);
        const width = Math.max(area.width, minHit);
        const height = Math.max(area.height, minHit);
        node.hitArea = new Rectangle(area.x + (area.width - width) / 2,
          area.y + (area.height - height) / 2, width, height);
      }
      node.children.forEach(expandTargets);
    }
    expandTargets(scene);
    floor.clear();
    const tile = Config.layout.floorTile;
    for (let y = 0; y < height; y += tile) for (let x = 0; x < width; x += tile) {
      floor.rect(x, y, tile - 2, tile - 2).fill((x / tile + y / tile) % 2 ? '#eee5d6' : '#e9dfcf');
    }
  }
  function visibility() {
    if (document.hidden) { saveSpeed(); app.stop(); audio.pause(); }
    else app.start();
  }
  function keydown(event: KeyboardEvent) {
    if (developmentLevelPanel.visible) {
      if (event.key === 'Escape') closeDevelopmentLevels();
      return;
    }
    if (menuOpen) {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === 'Enter') playFromMenu();
      else if (event.key === 'Escape') mainMenu.showSettings(false);
      else if (event.key.toLowerCase() === 'm') toggleSound();
      return;
    }
    if (featureOpen) return;
    if (pendingLevel !== null) return;
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key.toLowerCase() === 'd') { debugPanel?.toggle(); return; }
    if (adBlocked) return;
    if (pickerActive) {
      if (event.key === 'Escape') closeCratePicker();
      return;
    }
    if (/^[1-4]$/.test(event.key)) place(Number(event.key) - 1);
    else if (event.code === 'Space' || event.key === 'Escape') { event.preventDefault(); if (!settingsPanel.dismissConfirmation()) toggleSettings(); }
    else if (event.key.toLowerCase() === 'r') requestSettingsAction('replay');
    else if (event.key.toLowerCase() === 'n') next();
    else if (event.key.toLowerCase() === 'm') toggleSound();
  }

  if (requestedIndex >= 0 || !savedProgress) startLevel(levelIndex);
  else showMainMenu();
  platform.loadingFinished();
  app.ticker.add(ticker => {
    if (menuOpen) return;
    if (developmentLevelPanel.visible) return;
    const delta = Math.min(ticker.deltaMS, Config.motion.maxFrameMs);
    if (pendingLevel !== null) {
      loadingElapsed += delta;
      if (loadingRobot) loadingRobot.rotation += delta * 0.003;
      if (loadingElapsed >= 750) {
        const index = pendingLevel;
        pendingLevel = null;
        loadingScreen?.destroy({ children: true });
        loadingScreen = null;
        loadingBackground = null;
        loadingRobot = null;
        scene.eventMode = 'passive';
        buildLevel(index);
        sync();
      }
      return;
    }
    let gameplayDelta = delta;
    if (!document.hidden && model.state === 'Playing' && !settingsOpen && !adBlocked && !featureOpen && !pickerActive && !vacuumUi) {
      // Report the playable board, including onboarding, before the first tap.
      started = true;
      platform.gameplayStart();
      const realDelta = Math.max(0, ticker.deltaMS);
      gameplayDelta = speed.advance(realDelta, delta);
      if (speed.active) speedCheckpoint += realDelta;
      if (speedCheckpoint >= 5000 || (gameplayDelta > delta && !speed.active)) {
        speedCheckpoint = 0; saveSpeed();
      }
      model.update(gameplayDelta); board.update(gameplayDelta); puffs.update(gameplayDelta); hintMs = Math.max(0, hintMs - gameplayDelta);
    }
    speedButton.refresh(speed.active, speed.remainingMs);
    content.y += (pickerCameraTarget - content.y) * Math.min(1, delta / 140);
    sync();
    if (!settingsOpen && !adBlocked) crateTweens.update(gameplayDelta);
    if (lanes) drawConnections(lanes);
    if (docks) drawConnections(docks);
    if (tutorial) {
      tutorial.update(model, settingsOpen || adBlocked ? 0 : delta);
      if (settingsOpen || adBlocked || pickerActive) tutorial.visible = false;
    }
    if (!settingsOpen && !adBlocked) for (const child of modal.children) {
      if (child instanceof WinScreen || child instanceof LoseScreen || child instanceof BoosterGuide) child.update(delta);
    }
  });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('keydown', keydown);
  const resumeAudio = () => { if (!menuOpen && !adBlocked) gesture(); };
  const preventContextMenu = (event: Event) => event.preventDefault();
  app.canvas.addEventListener('pointerup', resumeAudio);
  app.canvas.addEventListener('contextmenu', preventContextMenu);
  resize();
  visibility();
  if (import.meta.hot) import.meta.hot.dispose(() => {
    unsubscribe();
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('keydown', keydown);
    app.canvas.removeEventListener('pointerup', resumeAudio);
    app.canvas.removeEventListener('contextmenu', preventContextMenu);
    safeAreaProbe.remove();
    status.remove();
    debugPanel?.dispose();
    botPool.dispose(view => view.destroy({ children: true }));
    audio.dispose();
    app.destroy({ removeView: true }, { children: true });
    atlas.destroy();
  });
  return app;
}
