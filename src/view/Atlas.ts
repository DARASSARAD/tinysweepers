import { Application, Graphics, Rectangle, Texture } from 'pixi.js';

export function createAtlas(app: Application) {
  const art = new Graphics()
    .roundRect(0, 5, 100, 95, 18).fill('#9fa9a3')
    .roundRect(0, 0, 100, 90, 18).fill('#ffffff')
    .roundRect(9, 8, 82, 16, 7).fill({ color: '#ffffff', alpha: 0.5 })
    .roundRect(120, 6, 88, 82, 24).fill('#a0aaa4')
    .roundRect(120, 0, 88, 80, 24).fill('#ffffff')
    .roundRect(131, 10, 66, 47, 16).fill('#e8eeea')
    .roundRect(138, 25, 52, 24, 10).fill('#314c49')
    .circle(153, 36, 4).fill('#ffffff').circle(176, 36, 4).fill('#ffffff')
    .roundRect(153, 66, 22, 5, 2).fill('#77877d')
    .roundRect(240, 8, 150, 126, 24).fill('#a0aaa4')
    .roundRect(240, 0, 150, 124, 24).fill('#ffffff')
    .roundRect(251, 10, 128, 100, 18).stroke({ color: '#ffffff', alpha: 0.55, width: 4 })
    .roundRect(287, 0, 56, 14, 5).fill('#e6e9e0');
  const atlas = app.renderer.generateTexture({ target: art, frame: new Rectangle(0, 0, 390, 134), resolution: 2 });
  art.destroy();
  return {
    cube: new Texture({ source: atlas.source, frame: new Rectangle(0, 0, 100, 100) }),
    bot: new Texture({ source: atlas.source, frame: new Rectangle(120, 0, 88, 88) }),
    crate: new Texture({ source: atlas.source, frame: new Rectangle(240, 0, 150, 134) }),
    destroy: () => atlas.destroy(true),
  };
}
export type GameAtlas = ReturnType<typeof createAtlas>;
