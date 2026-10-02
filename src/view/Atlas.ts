import { Application, Graphics, Rectangle, Texture } from 'pixi.js';

export function createAtlas(app: Application) {
  const art = new Graphics()
    .roundRect(0, 5, 100, 95, 18).fill('#9fa9a3')
    .roundRect(0, 0, 100, 90, 18).fill('#ffffff')
    .roundRect(9, 8, 82, 16, 7).fill({ color: '#ffffff', alpha: 0.5 })
    .roundRect(240, 8, 150, 126, 24).fill('#a0aaa4')
    .roundRect(240, 0, 150, 124, 24).fill('#ffffff')
    .roundRect(251, 10, 128, 100, 18).stroke({ color: '#ffffff', alpha: 0.55, width: 4 })
    .roundRect(287, 0, 56, 14, 5).fill('#e6e9e0');
  const vacuumDetails = (offset: number) => {
    for (const brushX of [15, 73]) {
      art.circle(offset + brushX, 68, 10).fill('#eab052');
      for (let spoke = 0; spoke < 10; spoke++) {
        const angle = spoke * Math.PI / 5;
        art.moveTo(offset + brushX, 68)
          .lineTo(offset + brushX + Math.cos(angle) * 11, 68 + Math.sin(angle) * 11)
          .stroke({ color: '#ba6b20', width: 1.5 });
      }
    }
    // Layered dome shading remains tintable so the shell follows its crate.
    art.circle(offset + 44, 44, 33).fill('#81909c')
      .ellipse(offset + 44, 38, 32, 30).fill('#dbe4ed')
      .ellipse(offset + 42, 34, 29, 26).fill('#ffffff')
      .ellipse(offset + 33, 20, 14, 6).fill({ color: '#ffffff', alpha: 0.85 })
      .arc(offset + 44, 38, 29, Math.PI * 0.12, Math.PI * 0.83).stroke({ color: '#a9bccb', width: 4 });
  };
  art.circle(164, 45, 40).fill('#263842')
    .circle(164, 41, 39).fill('#ffffff')
    .circle(164, 41, 35).stroke({ color: '#8eb0c2', width: 3 });
  vacuumDetails(400);
  // Separate untinted details retain contrast on every colored shell.
  // Face display uses its own atlas region; shell sprite stays tintable.
  art.roundRect(511, 24, 42, 25, 10).fill('#152637')
    .roundRect(513, 26, 38, 8, 5).fill({ color: '#5f7891', alpha: 0.5 })
    .roundRect(519, 30, 6, 12, 3).fill('#c6ffff')
    .roundRect(539, 30, 6, 12, 3).fill('#c6ffff')
    .ellipse(521, 19, 13, 5).fill({ color: '#ffffff', alpha: 0.65 })
    .roundRect(523, 56, 18, 3, 1.5).fill('#243444')
    .roundRect(526, 62, 12, 3, 1.5).fill('#243444');
  const atlas = app.renderer.generateTexture({ target: art, frame: new Rectangle(0, 0, 576, 134), resolution: 2 });
  art.destroy();
  return {
    cube: new Texture({ source: atlas.source, frame: new Rectangle(0, 0, 100, 100) }),
    bot: new Texture({ source: atlas.source, frame: new Rectangle(120, 0, 88, 88) }),
    botFace: new Texture({ source: atlas.source, frame: new Rectangle(400, 0, 88, 88) }),
    botDetails: new Texture({ source: atlas.source, frame: new Rectangle(488, 0, 88, 88) }),
    crate: new Texture({ source: atlas.source, frame: new Rectangle(240, 0, 150, 134) }),
    destroy: () => atlas.destroy(true),
  };
}
export type GameAtlas = ReturnType<typeof createAtlas>;
