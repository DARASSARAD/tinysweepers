import { Container, Graphics, Rectangle } from 'pixi.js';
import type { GameModel } from '../logic/GameModel';
import type { GameAtlas } from './Atlas';
import { CrateView } from './CrateView';
import { text } from './Elements';
import { dockPosition } from '../core/DockLayout';

export function drawDocks(parent: Container, model: GameModel, atlas: GameAtlas, symbols: boolean, unlock?: (side: 'left' | 'right') => void) {
  const group = new Container();
  parent.addChild(group);
  model.dockModel.docks.forEach((crate, index) => {
    const dock = new Container();
    dock.position.copyFrom(dockPosition(model.level.dockCount, index, model.dockModel.bonusSides.get(index)));
    dock.addChild(new Graphics().roundRect(-57, -43, 114, 106, 9).fill({ color: '#654b34', alpha: 0.22 })
      .roundRect(-57, -49, 114, 106, 9).fill('#d5dce0')
      .roundRect(-57, -54, 114, 106, 9).fill('#ffffff')
      .roundRect(-57, -54, 114, 106, 9).stroke({ color: '#e1e5e7', width: 2 }));
    if (crate && crate.atDock > 0) {
      const view = new CrateView({ color: crate.color, capacity: crate.atDock, pairId: crate.pairId }, model.level.palette, atlas, symbols, undefined, true);
      view.label = `dock-crate-${crate.id}`;
      view.scale.set(1);
      dock.addChild(view);
    }
    // Empty dock numbers hidden for now. Restore this line to show them again:
    // if (!crate) text(dock, `${index + 1}`, 0, 0, 32, '#a5b3a4');
    group.addChild(dock);
  });
  for (const side of model.level.id > 3 ? ['left', 'right'] as const : []) {
    if ([...model.dockModel.bonusSides.values()].includes(side)) continue;
    const slot = new Container();
    slot.position.copyFrom(dockPosition(model.level.dockCount, 0, side));
    slot.eventMode = 'static';
    slot.cursor = 'pointer';
    slot.hitArea = new Rectangle(-68, -65, 136, 124);
    slot.on('pointertap', () => unlock?.(side));
    slot.addChild(new Graphics().roundRect(-68, -59, 136, 118, 22).fill('#cfc6b8')
      .roundRect(-68, -65, 136, 118, 22).fill('#fffaf0')
      .roundRect(-68, -65, 136, 118, 22).stroke({ color: '#d4cbbd', width: 3 })
      .roundRect(-25, -38, 50, 36, 7).fill('#9c8068')
      .poly([-5, -30, -5, -10, 12, -20]).fill('#fffaf0'));
    text(slot, 'AD', 0, 23, 27, '#9c8068');
    group.addChild(slot);
  }
  return group;
}
