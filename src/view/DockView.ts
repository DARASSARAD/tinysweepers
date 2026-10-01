import { Container, Graphics } from 'pixi.js';
import { Config } from '../core/Config';
import type { GameModel } from '../logic/GameModel';
import type { GameAtlas } from './Atlas';
import { CrateView } from './CrateView';
import { text } from './Elements';

export function drawDocks(parent: Container, model: GameModel, atlas: GameAtlas, symbols: boolean) {
  const group = new Container();
  parent.addChild(group);
  model.dockModel.docks.forEach((crate, index) => {
    const dock = new Container();
    dock.position.set((Config.designWidth - (model.level.dockCount - 1) * Config.layout.dockSpacing) / 2
      + index * Config.layout.dockSpacing, Config.layout.dockY);
    dock.addChild(new Graphics().roundRect(-82, -62, 164, 150, 30).fill('#d9ddd1')
      .roundRect(-70, -53, 140, 119, 22).fill('#e9ecdf')
      .circle(0, 77, 6).fill(crate ? model.level.palette[crate.color] : '#96ac98'));
    if (crate) {
      const view = new CrateView({ color: crate.color, capacity: crate.undelivered }, model.level.palette, atlas, symbols);
      view.scale.set(0.82);
      dock.addChild(view);
      text(dock, model.board.canClaim(crate.color) || crate.unassigned === 0 ? 'cleaning' : 'waiting', 0, 116, 23, '#71817a');
    } else text(dock, `${index + 1}`, 0, 0, 32, '#a5b3a4');
    group.addChild(dock);
  });
  return group;
}
