import { Application, Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import { Config } from '../core/Config';
import { fitPlayArea } from '../core/Layout';

export async function createPreview() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#eee5d6',
    resolution: Math.min(window.devicePixelRatio || 1, Config.maxResolution),
    autoDensity: true,
    antialias: true,
    preference: 'webgl',
  });
  document.querySelector('#app')!.appendChild(app.canvas);
  const floor = new Graphics();
  const scene = new Container();
  app.stage.addChild(floor, scene);

  function label(text: string, y: number, size: number, color = '#314c49') {
    const title = new Text({ text, style: { fontFamily: 'system-ui', fontSize: size, fontWeight: '600', fill: color } });
    title.anchor.set(0.5);
    title.position.set(Config.designWidth / 2, y);
    scene.addChild(title);
    return title;
  }
  label('TINY SWEEPERS', 250, 70);
  label('A little clean. A little calm.', 340, 34, '#71817a');
  scene.addChild(new Graphics().roundRect(110, 470, 860, 880, 58).fill('#f9f5ec').stroke({ color: '#d6cdbd', width: 4 }));

  // Original bot silhouette, rasterized once to satisfy the P0 sprite milestone.
  const art = new Graphics()
    .roundRect(8, 22, 264, 246, 66).fill('#c8d4cb')
    .roundRect(0, 0, 264, 246, 66).fill('#64b5a4').stroke({ color: '#377b70', width: 8 })
    .roundRect(32, 28, 200, 158, 42).fill('#9bd4bc')
    .roundRect(51, 68, 162, 67, 27).fill('#314c49')
    .circle(99, 100, 10).fill('#fff7df')
    .circle(165, 100, 10).fill('#fff7df')
    .roundRect(101, 204, 62, 12, 6).fill('#377b70');
  const texture = app.renderer.generateTexture(art);
  art.destroy();
  const bot = new Sprite(texture);
  bot.anchor.set(0.5);
  bot.position.set(540, 865);
  bot.eventMode = 'static';
  bot.cursor = 'pointer';
  bot.hitArea = new Rectangle(-150, -150, 300, 300);
  scene.addChild(bot);
  label('Meet your first sweeper', 1160, 42);
  const hint = label('Tap the bot to say hello', 1230, 30, '#71817a');
  bot.on('pointertap', () => {
    bot.rotation += Config.preview.tapTurn;
    hint.text = 'Ready to tidy up!';
  });
  label('PROTOTYPE · PROJECT SETUP', 1530, 26, '#71817a');
  label('Puzzle mechanics come next', 1590, 30, '#71817a');

  function resize() {
    app.resize();
    app.renderer.resolution = Math.min(window.devicePixelRatio || 1, Config.maxResolution);
    const { width, height } = app.screen;
    const layout = fitPlayArea(width, height);
    scene.scale.set(layout.scale);
    scene.position.set(layout.x, layout.y);
    floor.clear();
    const tile = Config.preview.floorTile;
    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        floor.rect(x, y, tile - 2, tile - 2).fill((x / tile + y / tile) % 2 ? '#eee5d6' : '#e9dfcf');
      }
    }
  }
  let elapsed = 0;
  app.ticker.add((ticker) => {
    elapsed += ticker.deltaMS / 1000;
    bot.y = 865 + Math.sin(elapsed * Config.preview.bobSpeed) * Config.preview.bobAmplitude;
  });
  function visibility() { if (document.hidden) app.stop(); else app.start(); }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  document.addEventListener('visibilitychange', visibility);
  resize();
  visibility();
  if (import.meta.hot) import.meta.hot.dispose(() => {
    window.removeEventListener('resize', resize);
    window.removeEventListener('orientationchange', resize);
    document.removeEventListener('visibilitychange', visibility);
    app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true });
  });
  return app;
}
