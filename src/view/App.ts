import { Application, Container, Graphics, Rectangle } from 'pixi.js';
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
import { drawDocks } from './DockView';
import { button, text } from './Elements';
import { Puffs } from './fx/Puffs';
import { Pool } from './Pool';

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
  const floor = new Graphics();
  const scene = new Container();
  const header = new Container();
  const content = new Container();
  const controls = new Container();
  const modal = new Container();
  scene.addChild(header, content, controls, modal);
  app.stage.addChild(floor, scene);
  text(header, 'TINY SWEEPERS', 375, 100, 58);
  const levelLabel = text(header, '', 375, 166, 31, '#71817a');
  const counter = text(header, '', 540, 240, 34);
  const progressBar = new Graphics();
  header.addChild(progressBar);
  const pauseButton = button(header, 'Pause', 905, 125, 170, () => togglePause());
  const guide = text(controls, '', 540, 1470, 30, '#526e65');
  button(controls, 'Retry', 235, 1820, 220, () => restart());
  const patternButton = button(controls, '', 540, 1820, 270, () => toggleSymbols());
  const soundButton = button(controls, '', 845, 1820, 220, () => toggleSound());
  const botLayer = new Container();
  const botPool = new Pool(() => new BotView(atlas));
  const botViews = new Map<number, BotView>();
  let model: GameModel;
  let board: BoardView;
  let puffs: Puffs;
  let docks: Container | null = null;
  let lanes: Container | null = null;
  let dockSignature = '';
  let paused = false;
  let started = false;
  let hintOverride = '';
  let hintMs = 0;
  let unsubscribe = () => {};
  let lastCommercial = -Infinity;
  const baseHitAreas = new WeakMap<Container, Rectangle>();

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

  function startLevel(index: number) {
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
    paused = started = false;
    hintOverride = '';
    hintMs = 0;
    levelIndex = index;
    void platform.saveData(Config.progressKey, String(index));
    model = new GameModel(levels[index]);
    board = new BoardView(model, atlas, symbols);
    content.addChild(board);
    content.addChild(new Graphics().roundRect(465, 1154, 150, 75, 20).fill('#7b9181')
      .roundRect(481, 1164, 118, 29, 12).fill('#3f5e53'));
    text(content, 'DUSTBIN', 540, 1247, 20, '#71817a');
    puffs = new Puffs();
    content.addChild(botLayer, puffs);
    levelLabel.text = `Level ${index + 1} · ${levelNames[index]}`;
    pauseButton.label.text = 'Pause';
    drawLanes();
    unsubscribe = model.events.on(event => {
      if (event.type === 'placed') { audio.tone(220, 0.08); drawLanes(); }
      else if (event.type === 'delivered') {
        puffs.burst(Config.layout.binX, Config.layout.binY);
        audio.tone(620 + event.color * 90, 0.08);
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
  }

  function drawLanes() {
    if (lanes) { content.removeChild(lanes); lanes.destroy({ children: true }); }
    const laneGroup = new Container();
    lanes = laneGroup;
    model.dockModel.lanes.forEach((lane, laneIndex) => {
      const x = (Config.designWidth - (model.level.lanes.length - 1) * Config.layout.laneSpacing) / 2
        + laneIndex * Config.layout.laneSpacing;
      const shown = lane.slice(0, 3);
      for (let depth = shown.length - 1; depth >= 0; depth--) {
        const view = new CrateView(shown[depth], model.level.palette, atlas, symbols,
          depth === 0 ? () => place(laneIndex) : undefined);
        view.position.set(x, Config.layout.laneY + depth * 47);
        view.alpha = depth === 0 ? 1 : 0.58;
        laneGroup.addChild(view);
      }
      if (!lane.length) {
        laneGroup.addChild(new Graphics().roundRect(x - 68, Config.layout.laneY - 60, 136, 120, 24)
          .stroke({ color: '#c6c9b7', width: 3 }));
        text(laneGroup, '✓', x, Config.layout.laneY, 40, '#96a590');
      }
      text(laneGroup, `${lane.length} ${lane.length === 1 ? 'crate' : 'crates'}`, x, 1720, 24, '#71817a');
    });
    content.addChild(lanes);
    content.setChildIndex(botLayer, content.children.length - 1);
    content.setChildIndex(puffs, content.children.length - 1);
  }

  function place(lane: number) {
    if (paused || adBlocked || document.hidden || model.state !== 'Playing') return;
    gesture();
    if (model.placeCrate(lane)) { started = true; if (model.state === 'Playing') platform.gameplayStart(); }
    else if (model.dockModel.full) { hintOverride = 'All docks are busy. Let the bots finish.'; hintMs = 1800; }
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
    } else { clear(modal); gesture(); if (started) platform.gameplayStart(); }
    content.eventMode = paused ? 'none' : 'passive';
    sync();
  }
  function showResult() {
    clear(modal);
    const won = model.state === 'Won';
    const panelY = won ? 1280 : 540;
    modal.addChild(new Graphics().roundRect(90, panelY, 900, 480, 55).fill({ color: '#fffaf0', alpha: 0.97 })
      .roundRect(90, panelY, 900, 480, 55).stroke({ color: '#d3d9c4', width: 4 }));
    text(modal, won ? 'Squeaky clean!' : 'The docks are stuck', 540, panelY + 115, won ? 68 : 57);
    text(modal, won ? 'A little mosaic, beautifully uncovered.' : 'Choose exposed colors to keep bots moving.', 540, panelY + 222, 31, '#71817a');
    button(modal, won ? (levelIndex === levels.length - 1 ? 'Play again' : 'Next room') : 'Try again', 540, panelY + 370, 410, won ? next : restart);
    content.eventMode = 'none';
  }

  function sync() {
    board.sync(symbols);
    const signature = model.dockModel.docks.map(crate => crate ? `${crate.id}:${crate.undelivered}:${model.board.canClaim(crate.color)}` : '-').join('|');
    if (signature !== dockSignature) {
      if (docks) { content.removeChild(docks); docks.destroy({ children: true }); }
      docks = drawDocks(content, model, atlas, symbols);
      content.setChildIndex(botLayer, content.children.length - 1);
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
    progressBar.clear().roundRect(140, 283, 800, 13, 6).fill('#d9dbc9');
    if (cleaned > 0) progressBar.roundRect(140, 283, 800 * cleaned / total, 13, 6).fill('#65b9aa');
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
    const summary = `Level ${levelIndex + 1}. ${adBlocked ? 'Ad break' : paused ? 'Paused' : model.state}. ${model.board.remaining} cubes remaining. ${occupied} of ${model.level.dockCount} docks occupied.`;
    if (status.textContent !== summary) status.textContent = summary;
  }

  function resize() {
    app.resize();
    app.renderer.resolution = Math.min(window.devicePixelRatio || 1, Config.maxResolution);
    const { width, height } = app.screen;
    const layout = fitPlayArea(width, height);
    scene.scale.set(layout.scale);
    scene.position.set(layout.x, layout.y);
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
    if (!paused && !adBlocked) { model.update(delta); board.update(delta); puffs.update(delta); hintMs = Math.max(0, hintMs - delta); }
    sync();
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
