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
  });
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
  await platform.saveData(Config.goldKey, String(gold));
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
  app.stage.addChild(floor, scene);
  const levelLabel = text(header, '', 540, 110, 42);
  levelLabel.style.fontFamily = 'Arial, Helvetica, sans-serif';
  levelLabel.style.fontWeight = '800';
  const counter = text(header, '', 540, 170, 34);
  const progressBar = new Graphics();
  header.addChild(progressBar);
  const settingsButton = button(header, '', 970, 110, 120, () => toggleSettings());
  const gear = new Graphics();
  for (let tooth = 0; tooth < 8; tooth++) {
    const angle = tooth * Math.PI / 4;
    const points = [[-7, -34], [7, -34], [7, -21], [-7, -21]]
      .flatMap(([x, y]) => [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)]);
    gear.poly(points).fill('#fffaf0');
  }
  gear.circle(0, 0, 25).fill('#fffaf0').circle(0, 0, 11).fill('#176f68');
  settingsButton.item.addChild(gear);
  const guide = text(controls, '', 540, 1470, 30, '#526e65');
  guide.visible = false;
  // The queue feeds upward from behind the bottom powerup panel.
  controls.addChild(new Graphics()
    .roundRect(0, 1790, Config.designWidth, Config.designHeight - 1790 + 40, 40).fill('#526ca5')
    .roundRect(0, 1797, Config.designWidth, Config.designHeight - 1797 + 40, 40).fill('#6381b5')
    .rect(0, 1890, Config.designWidth, 30).fill({ color: '#526ca5', alpha: 0.25 }));
  const pickerPowerup = new Container();
  pickerPowerup.position.set(330, 1810);
  pickerPowerup.hitArea = new Rectangle(-76, -76, 152, 152);
  pickerPowerup.on('pointertap', () => activateCratePicker());
  controls.addChild(pickerPowerup);
  // The remaining powerups are decorative until their gameplay is implemented.
  for (const [index, unlockLevel] of [6, 9].entries()) {
    const powerup = new Container();
    powerup.position.set(540 + index * 210, 1810);
    powerup.addChild(new Graphics().circle(0, 6, 64).fill({ color: '#79604b', alpha: 0.2 })
      .circle(0, 0, 64).fill('#ffefd1').stroke({ color: '#526ca5', width: 9 })
      .arc(0, -27, 16, Math.PI, Math.PI * 2).stroke({ color: '#ba7812', width: 7 })
      .roundRect(-25, -28, 50, 42, 12).fill('#ffc62d').stroke({ color: '#ba7812', width: 3 })
      .circle(0, -9, 5).fill('#965d09')
      .rect(-3, -8, 6, 11).fill('#965d09'));
    text(powerup, `Lv. ${unlockLevel}`, 0, 41, 29, '#705024');
    controls.addChild(powerup);
  }
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
  let connectedFeatureClaimed = false;
  let mysteryFeatureClaimed = false;
  let settingsOpen = false;
  let started = false;
  let pickerActive = false;
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

  function refreshMainMenu() {
    const nextIndex = hasStartedLevel && model.state === 'Won' ? Math.min(levelIndex + 1, levels.length - 1) : levelIndex;
    mainMenu.refresh(levels[nextIndex].id, savedProgress || hasStartedLevel, audio.enabled, gold, audio.musicEnabled, hapticsEnabled);
  }

  function showMainMenu() {
    if (adBlocked || pendingLevel !== null) return;
    menuOpen = true;
    settingsOpen = false;
    settingsPanel.visible = false;
    header.visible = content.visible = controls.visible = modal.visible = false;
    mainMenu.visible = true;
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
    if (featureOpen || pickerActive) return;
    if (adBlocked) return;
    settingsPanel.dismissConfirmation();
    settingsOpen = !settingsOpen;
    settingsPanel.visible = settingsOpen;
    content.eventMode = settingsOpen || model.state !== 'Playing' ? 'none' : 'passive';
    if (settingsOpen) { audio.pause(); platform.gameplayStop(); }
    else if (started && model.state === 'Playing') { gesture(); platform.gameplayStart(); }
  }

  function requestSettingsAction(action: 'replay' | 'home') {
    if (adBlocked || featureOpen || pickerActive || pendingLevel !== null) return;
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
    for (const child of pickerPowerup.removeChildren()) child.destroy({ children: true });
    const unlocked = levelIndex + 1 >= Config.cratePickerUnlockLevel;
    const available = unlocked && cratePickerCount > 0;
    pickerPowerup.eventMode = available ? 'static' : 'none';
    pickerPowerup.cursor = available ? 'pointer' : 'default';
    pickerPowerup.alpha = 1;
    if (!unlocked) {
      pickerPowerup.addChild(new Graphics()
        .circle(0, 6, 64).fill({ color: '#79604b', alpha: 0.2 })
        .circle(0, 0, 64).fill('#ffefd1').stroke({ color: '#526ca5', width: 9 })
        .arc(0, -27, 16, Math.PI, Math.PI * 2).stroke({ color: '#ba7812', width: 7 })
        .roundRect(-25, -28, 50, 42, 12).fill('#ffc62d').stroke({ color: '#ba7812', width: 3 })
        .circle(0, -9, 5).fill('#965d09')
        .rect(-3, -8, 6, 11).fill('#965d09'));
      text(pickerPowerup, `Lv. ${Config.cratePickerUnlockLevel}`, 0, 41, 29, '#705024');
      return;
    }
    pickerPowerup.addChild(new Graphics()
      .circle(0, 5, 57).fill({ color: '#263146', alpha: 0.22 })
      .circle(0, 0, 57).fill('#fff0cd').stroke({ color: '#927454', width: 4 })
      .circle(0, -2, 52).stroke({ color: '#fff9e8', width: 3 }));
    const cards = new Container();
    cards.position.set(-5, -5);
    const back = new Graphics().roundRect(-29, -31, 46, 63, 8)
      .fill('#e1e3e8').stroke({ color: '#777a86', width: 3 });
    back.rotation = -0.3;
    cards.addChild(back);
    const front = new Graphics().roundRect(-21, -35, 46, 63, 8)
      .fill('#ffffff').stroke({ color: '#777a86', width: 3 })
      .roundRect(-17, -31, 38, 55, 6).stroke({ color: '#e9edf1', width: 2 });
    front.rotation = 0.12;
    cards.addChild(front);
    cards.addChild(new Graphics()
      .poly([9, -13, 23, -13, 23, -1, 35, -1, 35, 13, 23, 13, 23, 25,
        9, 25, 9, 13, -3, 13, -3, -1, 9, -1])
      .fill('#59ce35').stroke({ color: '#ffffff', width: 6, join: 'round' })
      .poly([9, -13, 23, -13, 23, -1, 35, -1, 35, 13, 23, 13, 23, 25,
        9, 25, 9, 13, -3, 13, -3, -1, 9, -1])
      .stroke({ color: '#2c8d2e', width: 3, join: 'round' }));
    pickerPowerup.addChild(cards);
    pickerPowerup.addChild(new Graphics().circle(42, 44, 24).fill({ color: '#233c50', alpha: 0.2 })
      .circle(42, 41, 24).fill('#ffffff').stroke({ color: '#527fa0', width: 3 }));
    const count = text(pickerPowerup, cratePickerCount > 0 ? String(cratePickerCount) : '+', 42, 41, 29, '#216b9b');
    count.style.fontWeight = '800';
  }
  function gesture() { audio.unlock(); }
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
    const layout = fitPlayArea(width, height);
    loadingBackground.clear().rect(-layout.x / layout.scale, -layout.y / layout.scale,
      width / layout.scale, height / layout.scale).fill('#0754c4');
  }
  function resizeResultBackdrop() {
    if (!resultBackdrop) return;
    const { width, height } = app.screen;
    const layout = fitPlayArea(width, height);
    resultBackdrop.clear().rect(-layout.x / layout.scale, -layout.y / layout.scale,
      width / layout.scale, height / layout.scale).fill({ color: '#19243c', alpha: 0.72 });
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
    pickerActive = false;
    pickerCameraTarget = 0;
    content.y = 0;
    content.eventMode = 'passive';
    docks = lanes = null;
    dockSignature = '';
    started = settingsOpen = false;
    featureOpen = false;
    settingsPanel.visible = false;
    hintOverride = '';
    hintMs = 0;
    levelIndex = index;
    void platform.saveData(Config.progressKey, String(index));
    const boosterTutorial = levels[index].id === Config.cratePickerUnlockLevel;
    pickerTutorialRequired = boosterTutorial;
    if (boosterTutorial) {
      cratePickerCount++;
      void platform.saveData(Config.powerupsKey, JSON.stringify({ cratePickerCount }));
    }
    model = new GameModel(boosterTutorial ? boosterTutorialLevel(levels[index]) : levels[index]);
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
        audio.tone(620 + event.color * 90, 0.08);
      }
      else if (event.type === 'delivered') {
        puffs.burst(Config.layout.binX, Config.layout.binY);
      } else {
        platform.gameplayStop();
        if (event.state === 'Won') {
          audio.win();
          vibrate([30, 40, 60]);
          gold += 50;
          void platform.saveData(Config.goldKey, String(gold));
          void platform.saveData(Config.progressKey, String(Math.min(index + 1, levels.length - 1)));
        }
        showResult();
      }
    });
    saveSettings();
    sync();
    if (boosterTutorial) {
      featureOpen = true;
      content.eventMode = 'none';
      modal.addChild(new BoosterUnlock(() => {
        gesture();
        featureOpen = false;
        clear(modal);
        content.eventMode = 'passive';
        activateCratePicker();
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
    if (levelIndex + 1 < Config.cratePickerUnlockLevel || cratePickerCount <= 0 || pickerActive
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
      void platform.saveData(Config.powerupsKey, JSON.stringify({ cratePickerCount }));
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
    if (featureOpen || pickerActive) return;
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
  function restart() { if (!adBlocked) { gesture(); startLevel(levelIndex); } }
  async function next() {
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
      modal.addChild(new WinScreen(model.level.id, model.level.pixels.filter(color => color >= 0).length,
        levelIndex === levels.length - 1, next, restart));
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

  function resize() {
    app.resize();
    app.renderer.resolution = Math.min(window.devicePixelRatio || 1, Config.maxResolution);
    const { width, height } = app.screen;
    const layout = fitPlayArea(width, height);
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
    if (document.hidden) { app.stop(); audio.pause(); platform.gameplayStop(); }
    else app.start();
  }
  function keydown(event: KeyboardEvent) {
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

  if (requestedIndex >= 0) startLevel(levelIndex);
  else showMainMenu();
  platform.loadingFinished();
  app.ticker.add(ticker => {
    if (menuOpen) return;
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
    if (!settingsOpen && !adBlocked && !featureOpen && !pickerActive) {
      model.update(delta); board.update(delta); puffs.update(delta); hintMs = Math.max(0, hintMs - delta);
    }
    content.y += (pickerCameraTarget - content.y) * Math.min(1, delta / 140);
    sync();
    if (!settingsOpen && !adBlocked) crateTweens.update(delta);
    if (lanes) drawConnections(lanes);
    if (docks) drawConnections(docks);
    if (tutorial) {
      tutorial.update(model, settingsOpen || adBlocked ? 0 : delta);
      if (settingsOpen || adBlocked || pickerActive) tutorial.visible = false;
    }
    if (!settingsOpen && !adBlocked) for (const child of modal.children) {
      if (child instanceof WinScreen || child instanceof LoseScreen) child.update(delta);
    }
  });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('keydown', keydown);
  resize();
  visibility();
  if (import.meta.hot) import.meta.hot.dispose(() => {
    unsubscribe();
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('keydown', keydown);
    status.remove();
    debugPanel?.dispose();
    botPool.dispose(view => view.destroy({ children: true }));
    audio.dispose();
    app.destroy({ removeView: true }, { children: true });
    atlas.destroy();
  });
  return app;
}
