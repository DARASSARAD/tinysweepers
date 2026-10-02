import { Application, Assets, Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import logoUrl from '../../TinySweeperdLogo-Photoroom.png?url';
import { AudioManager } from '../audio/AudioManager';
import { Config } from '../core/Config';
import { fitPlayArea } from '../core/Layout';
import { GameModel } from '../logic/GameModel';
import { levels, levelNames } from '../logic/Levels';
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
import { TutorialView } from './TutorialView';
import { resultTypography } from './ResultTypography';
import { drawConnections } from './ConnectedCrates';
import { FeatureUnlock } from './FeatureUnlock';

declare const __PLATFORM__: 'local' | 'poki' | 'crazygames';

export async function createGame() {
  const app = new Application();
  await app.init({ resizeTo: window, background: '#eee5d6',
    resolution: Math.min(window.devicePixelRatio || 1, Config.maxResolution),
    autoDensity: true, antialias: true, preference: 'webgl' });
  document.querySelector('#app')!.appendChild(app.canvas);
  app.canvas.setAttribute('role', 'img');
  app.canvas.tabIndex = 0;
  app.canvas.setAttribute('aria-label', 'Tiny Sweepers. Tap a top crate to send matching bots. Keyboard: 1 to 4 select lanes, R retries, Space pauses, M toggles sound, P toggles color symbols.');
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
  let symbols = false;
  let levelIndex = 0;
  try {
    const saved = JSON.parse(await platform.loadData(Config.settingsKey) ?? '{}') as { sound?: boolean; symbols?: boolean };
    audio.enabled = saved.sound !== false;
    symbols = saved.symbols === true;
    const progress = Number(await platform.loadData(Config.progressKey) ?? 0);
    if (Number.isInteger(progress) && progress >= 0 && progress < levels.length) levelIndex = progress;
  } catch { /* Ignore corrupt saves. */ }
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
  const settingsPanel = new Container();
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
  const settingsBackdrop = new Graphics().rect(0, 0, Config.designWidth, Config.designHeight)
    .fill({ color: '#243b35', alpha: 0.35 });
  settingsBackdrop.eventMode = 'static';
  settingsPanel.addChild(settingsBackdrop);
  settingsPanel.addChild(new Graphics().roundRect(180, 270, 720, 1420, 45).fill('#fffaf0'));
  text(settingsPanel, 'Settings', 540, 365, 56);
  const pauseButton = button(settingsPanel, 'Pause', 540, 500, 460, () => togglePause());
  const guide = text(controls, '', 540, 1470, 30, '#526e65');
  guide.visible = false;
  // The queue feeds upward from behind the bottom powerup panel.
  controls.addChild(new Graphics()
    .roundRect(0, 1790, Config.designWidth, Config.designHeight - 1790 + 40, 40).fill('#526ca5')
    .roundRect(0, 1797, Config.designWidth, Config.designHeight - 1797 + 40, 40).fill('#6381b5')
    .rect(0, 1890, Config.designWidth, 30).fill({ color: '#526ca5', alpha: 0.25 }));
  // Powerup placeholders are decorative until their gameplay is implemented.
  for (const [index, unlockLevel] of [4, 6, 9].entries()) {
    const powerup = new Container();
    powerup.position.set(540 + (index - 1) * 210, 1810);
    powerup.addChild(new Graphics().circle(0, 6, 64).fill({ color: '#79604b', alpha: 0.2 })
      .circle(0, 0, 64).fill('#ffefd1').stroke({ color: '#526ca5', width: 9 })
      .arc(0, -27, 16, Math.PI, Math.PI * 2).stroke({ color: '#ba7812', width: 7 })
      .roundRect(-25, -28, 50, 42, 12).fill('#ffc62d').stroke({ color: '#ba7812', width: 3 })
      .circle(0, -9, 5).fill('#965d09')
      .rect(-3, -8, 6, 11).fill('#965d09'));
    text(powerup, `Lv. ${unlockLevel}`, 0, 41, 29, '#705024');
    controls.addChild(powerup);
  }
  button(settingsPanel, 'Retry', 540, 650, 460, () => { toggleSettings(); restart(); });
  const soundButton = button(settingsPanel, '', 540, 800, 460, () => toggleSound());
  const patternButton = button(settingsPanel, '', 540, 950, 460, () => toggleSymbols());
  settingsPanel.addChild(new Graphics().roundRect(240, 1060, 600, 460, 28).fill('#e9ecdf'));
  text(settingsPanel, 'Choose a level', 540, 1115, 34);
  const selectedLevelLabel = text(settingsPanel, '', 540, 1190, 30);
  let selectedLevel = levelIndex;
  function refreshLevelPicker() {
    selectedLevelLabel.text = `Level ${selectedLevel + 1} · ${levelNames[selectedLevel]}`;
    selectedLevelLabel.scale.set(1);
    selectedLevelLabel.scale.set(Math.min(1, 540 / selectedLevelLabel.width));
  }
  button(settingsPanel, 'Previous', 390, 1300, 250, () => {
    selectedLevel = (selectedLevel - 1 + levels.length) % levels.length;
    refreshLevelPicker();
  });
  button(settingsPanel, 'Next', 690, 1300, 250, () => {
    selectedLevel = (selectedLevel + 1) % levels.length;
    refreshLevelPicker();
  });
  button(settingsPanel, 'Play level', 540, 1445, 460, () => {
    if (adBlocked) return;
    gesture();
    startLevel(selectedLevel);
  });
  button(settingsPanel, 'Close', 540, 1605, 460, () => toggleSettings());
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
  let paused = false;
  let featureOpen = false;
  let connectedFeatureClaimed = false;
  let settingsOpen = false;
  let started = false;
  let hintOverride = '';
  let hintMs = 0;
  let unsubscribe = () => {};
  let lastCommercial = -Infinity;
  const baseHitAreas = new WeakMap<Container, Rectangle>();

  function toggleSettings() {
    if (featureOpen) return;
    if (adBlocked) return;
    settingsOpen = !settingsOpen;
    settingsPanel.visible = settingsOpen;
    if (settingsOpen) { selectedLevel = levelIndex; refreshLevelPicker(); }
    content.eventMode = settingsOpen || paused || model.state !== 'Playing' ? 'none' : 'passive';
    if (settingsOpen) { audio.pause(); platform.gameplayStop(); }
    else if (!paused && started && model.state === 'Playing') { gesture(); platform.gameplayStart(); }
  }

  function saveSettings() {
    void platform.saveData(Config.settingsKey, JSON.stringify({ sound: audio.enabled, symbols }));
    patternButton.label.text = symbols ? 'Symbols on' : 'Symbols off';
    soundButton.label.text = audio.enabled ? 'Sound on' : 'Sound off';
  }
  function gesture() { audio.unlock(); }
  function toggleSymbols() {
    if (adBlocked) return;
    symbols = !symbols;
    saveSettings();
    drawLanes();
    dockSignature = '';
    board.sync(symbols);
  }
  function toggleSound() {
    if (adBlocked) return;
    audio.enabled = !audio.enabled;
    if (audio.enabled) gesture(); else audio.pause();
    saveSettings();
  }
  function clear(container: Container) {
    for (const child of container.removeChildren()) child.destroy({ children: true });
  }

  let pendingLevel: number | null = null;
  let loadingElapsed = 0;
  let loadingScreen: Container | null = null;
  let loadingBackground: Graphics | null = null;
  let loadingRobot: Sprite | null = null;
  function resizeLoadingBackground() {
    if (!loadingBackground) return;
    const { width, height } = app.screen;
    const layout = fitPlayArea(width, height);
    loadingBackground.clear().rect(-layout.x / layout.scale, -layout.y / layout.scale,
      width / layout.scale, height / layout.scale).fill('#0754c4');
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
    content.eventMode = 'passive';
    docks = lanes = null;
    dockSignature = '';
    paused = started = settingsOpen = false;
    featureOpen = false;
    settingsPanel.visible = false;
    hintOverride = '';
    hintMs = 0;
    levelIndex = index;
    void platform.saveData(Config.progressKey, String(index));
    model = new GameModel(levels[index]);
    board = new BoardView(model, symbols);
    content.addChild(board);
    content.addChild(new Graphics().roundRect(Config.layout.binX - 75, Config.layout.binY - 36, 150, 75, 20).fill('#58a99a')
      .roundRect(Config.layout.binX - 59, Config.layout.binY - 26, 118, 29, 12).fill('#176f68'));
    text(content, 'DUSTBIN', Config.layout.binX, Config.layout.binY + 57, 20, '#71817a');
    puffs = new Puffs();
    content.addChild(botLayer, puffs);
    levelLabel.text = `Level ${index + 1}`;
    if (model.level.id === 1) {
      tutorial = new TutorialView();
      controls.addChild(tutorial);
      tutorial.update(model, 0);
    }
    pauseButton.label.text = 'Pause';
    drawLanes();
    unsubscribe = model.events.on(event => {
      if (event.type === 'placed') {
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
          void platform.saveData(Config.progressKey, String(Math.min(index + 1, levels.length - 1)));
        }
        showResult();
      }
    });
    saveSettings();
    sync();
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
        const view = new CrateView(shown[depth], model.level.palette, atlas, symbols,
          depth === 0 ? () => place(laneIndex) : undefined, depth === 0);
        view.scale.set(1);
        view.position.set(x, Config.layout.laneY - 35 + depth * Config.layout.laneRowSpacing);
        view.alpha = depth === 0 ? 1 : 0.85;
        if (old) {
          const targetY = view.y;
          view.position.copyFrom(old.position);
          view.alpha = old.alpha;
          crateTweens.move(view, x, targetY, 1, depth === 0 ? 1 : 0.85);
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
    if (featureOpen) return;
    if (paused || settingsOpen || adBlocked || document.hidden || model.state !== 'Playing') return;
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
  function togglePause() {
    if (featureOpen) return;
    if (adBlocked || model.state !== 'Playing') return;
    paused = !paused;
    pauseButton.label.text = paused ? 'Resume' : 'Pause';
    if (paused) {
      audio.pause();
      platform.gameplayStop();
      clear(modal);
      modal.addChild(new Graphics().roundRect(90, 480, 900, 610, 55).fill({ color: '#fffaf0', alpha: 0.97 }));
      text(modal, 'Take a breather', 540, 670, 64);
      text(modal, 'Your sweepers will wait for you.', 540, 780, 32, '#71817a');
      button(modal, 'Keep sweeping', 540, 920, 430, togglePause);
    } else { clear(modal); gesture(); if (started && !settingsOpen) platform.gameplayStart(); }
    content.eventMode = paused || settingsOpen ? 'none' : 'passive';
    sync();
  }
  function showResult() {
    clear(modal);
    const won = model.state === 'Won';
    if (won) {
      modal.addChild(new WinScreen(model.level.id, model.level.pixels.filter(color => color >= 0).length,
        levelIndex === levels.length - 1, next, restart));
      content.eventMode = 'none';
      return;
    }
    const panelY = won ? 1280 : 540;
    modal.addChild(new Graphics().roundRect(90, panelY, 900, 480, 55).fill({ color: '#fffaf0', alpha: 0.97 })
      .roundRect(90, panelY, 900, 480, 55).stroke({ color: '#d3d9c4', width: 4 }));
    resultTypography(text(modal, 'The docks are stuck', 540, panelY + 115, 62, '#244d58'), 'heading');
    resultTypography(text(modal, 'Choose exposed colors to keep bots moving.', 540, panelY + 222, 33, '#647781'), 'body');
    resultTypography(button(modal, 'TRY AGAIN', 540, panelY + 370, 410, restart).label, 'button');
    content.eventMode = 'none';
  }

  function sync() {
    board.sync(symbols);
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
      docks = drawDocks(content, model, atlas, symbols, side => {
        if (paused || settingsOpen || adBlocked || featureOpen || model.state !== 'Playing') return;
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
    guide.text = paused ? 'Paused · take your time' : model.state === 'Won' ? 'Room complete — nice work!'
      : model.state === 'Lost' ? 'Retry and leave room for the outer colors'
        : hintMs > 0 ? hintOverride : waiting > 0 ? 'Waiting bots need their color exposed'
          : started ? 'Match the exposed dust. Keep a dock free.' : 'Tap a top crate to send its sweepers';
    const occupied = model.dockModel.docks.filter(crate => crate !== null).length;
    app.canvas.dataset.level = String(levelIndex + 1);
    app.canvas.dataset.state = adBlocked ? 'Ad break' : paused ? 'Paused' : model.state;
    app.canvas.dataset.remaining = String(model.board.remaining);
    app.canvas.dataset.docks = String(occupied);
    const summary = `Level ${levelIndex + 1}. ${adBlocked ? 'Ad break' : paused ? 'Paused' : model.state}. ${model.board.remaining} cubes remaining. ${occupied} of ${model.dockModel.docks.length} docks occupied.`;
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
    // Keep small-height desktop windows usable with a minimum CSS tap area.
    const minHit = Config.minTapTarget / layout.scale;
    function expandTargets(node: Container) {
      if (node.hitArea instanceof Rectangle) {
        const area = baseHitAreas.get(node) ?? node.hitArea.clone();
        baseHitAreas.set(node, area);
        const width = Math.max(area.width, minHit);
        const height = Math.max(area.height, minHit);
        node.hitArea = new Rectangle(-width / 2, -height / 2, width, height);
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
    if (featureOpen) return;
    if (pendingLevel !== null) return;
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key.toLowerCase() === 'd') { debugPanel?.toggle(); return; }
    if (adBlocked) return;
    if (/^[1-4]$/.test(event.key)) place(Number(event.key) - 1);
    else if (event.code === 'Space' || event.key === 'Escape') { event.preventDefault(); togglePause(); }
    else if (event.key.toLowerCase() === 'r') restart();
    else if (event.key.toLowerCase() === 'n') next();
    else if (event.key.toLowerCase() === 'm') toggleSound();
    else if (event.key.toLowerCase() === 'p') toggleSymbols();
  }

  startLevel(levelIndex);
  platform.loadingFinished();
  app.ticker.add(ticker => {
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
    if (!paused && !settingsOpen && !adBlocked && !featureOpen) { model.update(delta); board.update(delta); puffs.update(delta); hintMs = Math.max(0, hintMs - delta); }
    sync();
    if (!paused && !settingsOpen && !adBlocked) crateTweens.update(delta);
    if (lanes) drawConnections(lanes);
    if (docks) drawConnections(docks);
    if (tutorial) {
      tutorial.update(model, paused || settingsOpen || adBlocked ? 0 : delta);
      if (paused || settingsOpen || adBlocked) tutorial.visible = false;
    }
    if (!settingsOpen && !adBlocked) for (const child of modal.children) {
      if (child instanceof WinScreen) child.update(delta);
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
