import { expect, it } from 'vitest';
import { boosterTutorialLevel } from '../src/logic/BoosterTutorial';
import { levels } from '../src/logic/Levels';
import { validate } from '../src/logic/LevelData';
import { GameModel } from '../src/logic/GameModel';

it('adds one selectable practice crate without changing cube totals or the campaign source', () => {
  const source = levels.find(level => level.id === 5)!;
  const original = JSON.stringify(source);
  const tutorial = boosterTutorialLevel(source);
  expect(tutorial.lanes.flat()).toHaveLength(source.lanes.flat().length + 1);
  expect(() => validate(tutorial)).not.toThrow();
  const game = new GameModel(tutorial);
  expect(tutorial.lanes.every(lane => lane[0].color === 2)).toBe(true);
  const practiceDepth = tutorial.lanes[0].findIndex(crate => crate.capacity === 1);
  expect(practiceDepth).toBeGreaterThan(0);
  expect(game.placeBuriedCrate(0, practiceDepth)).toBe(true);
  expect(game.dockModel.docks[0]?.capacity).toBe(1);
  expect(JSON.stringify(source)).toBe(original);
});
