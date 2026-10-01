import { Config } from '../core/Config';
import { validate, type CrateData, type LevelData } from './LevelData';

interface SearchState { cells: number[]; heads: number[]; docks: CrateData[] }
export interface SolverResult {
  status: 'solvable' | 'unsolvable' | 'limit';
  solution: number[];
  visited: number;
  maxOccupiedDocks: number;
}

// Settled-state search: animations/reservations are replaced with immediate
// exposed-cube removal. Real timing is checked separately in campaign tests.
export function solve(level: LevelData, maxStates: number = Config.levels.maxSolverStates): SolverResult {
  validate(level);
  const seen = new Set<string>();
  let limited = false;
  let maxOccupiedDocks = 0;
  function exposed(cells: number[], index: number) {
    const x = index % level.width;
    const y = Math.floor(index / level.width);
    return x === 0 || y === 0 || x === level.width - 1 || y === level.height - 1
      || cells[index - 1] < 0 || cells[index + 1] < 0 || cells[index - level.width] < 0 || cells[index + level.width] < 0;
  }
  function settle(state: SearchState) {
    let progress = true;
    while (progress) {
      progress = false;
      for (const crate of state.docks) {
        for (let row = level.height - 1; row >= 0 && crate.capacity > 0; row--) {
          for (let column = 0; column < level.width && crate.capacity > 0; column++) {
            const index = row * level.width + column;
            if (state.cells[index] === crate.color && exposed(state.cells, index)) {
              state.cells[index] = -1;
              crate.capacity--;
              progress = true;
            }
          }
        }
      }
      state.docks = state.docks.filter(crate => crate.capacity > 0);
    }
  }
  function search(state: SearchState, path: number[]): number[] | null {
    settle(state);
    if (state.cells.every(color => color < 0)) return path;
    if (state.docks.length >= level.dockCount) return null;
    const key = JSON.stringify([state.cells, state.heads, state.docks.map(c => [c.color, c.capacity]).sort()]);
    if (seen.has(key)) return null;
    if (seen.size >= maxStates) { limited = true; return null; }
    seen.add(key);
    const choices = level.lanes.map((lane, i) => ({ lane: i, crate: lane[state.heads[i]] }))
      .filter(choice => choice.crate)
      .sort((a, b) => {
        const count = (color: number) => state.cells.reduce((n, c, i) => n + Number(c === color && exposed(state.cells, i)), 0);
        return count(b.crate.color) - count(a.crate.color);
      });
    for (const choice of choices) {
      const next: SearchState = { cells: [...state.cells], heads: [...state.heads], docks: state.docks.map(c => ({ ...c })) };
      next.heads[choice.lane]++;
      next.docks.push({ ...choice.crate });
      maxOccupiedDocks = Math.max(maxOccupiedDocks, next.docks.length);
      const result = search(next, [...path, choice.lane]);
      if (result) return result;
      if (limited) break;
    }
    return null;
  }
  const solution = search({ cells: [...level.pixels], heads: level.lanes.map(() => 0), docks: [] }, []);
  return { status: solution ? 'solvable' : limited ? 'limit' : 'unsolvable', solution: solution ?? [], visited: seen.size, maxOccupiedDocks };
}
