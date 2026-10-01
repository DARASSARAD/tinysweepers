import { mkdir, writeFile } from 'node:fs/promises';
import { Config } from '../../src/core/Config';
import { GameModel } from '../../src/logic/GameModel';
import { solve } from '../../src/logic/Solver';
import { generateLevel } from './Generate';

const motifs = [
  { name: 'Pocket garden', rows: ['00000000','00100100','01311310','00133100','00022000','00222200','00022000','00022000'] },
  { name: 'Little heart', rows: ['00000000','01100110','12211221','12222221','01222210','00122100','00011000','00000000'] },
  { name: 'Sunny window', rows: ['00011000','01011010','00122100','11233211','11233211','00122100','01011010','00011000'] },
  { name: 'Friendly bot', rows: ['00011000','00011000','02222220','02322320','02122120','02211220','02222220','03000030'] },
  { name: 'Gone fishing', rows: ['00000000','00000000','00222003','02212233','22222233','02222203','00222000','00000000'] },
  { name: 'Home sweet home', rows: ['00011000','00122100','01222210','12222221','03333330','03133130','03322330','03322330'] },
  { name: 'Tiny tulip', rows: ['00000000','01000100','01131100','00131000','00020000','02020200','00222000','00020000'] },
  { name: 'Night flight', rows: ['00010000','00121000','00131000','00131000','01232100','12232210','00333000','00101000'] },
  { name: 'Mug of calm', rows: ['00101000','00010100','00000000','01111100','01222110','01222010','01222110','00111000'] },
];
const palettes = [
  ['#9bd4cc','#efb65b','#e68e91','#72899c'],
  ['#b3bedb','#e68e91','#f4c885','#789e89'],
  ['#e7cdb2','#718fbb','#8abca6','#e7a080'],
];

await mkdir('levels', { recursive: true });
for (let id = 4; id <= 30; id++) {
  const motif = motifs[(id - 4) % motifs.length];
  const size = id <= 15 ? 8 : id <= 22 ? 10 : 12;
  const pixels = Array.from({ length: size * size }, (_, index) => {
    const x = Math.floor((index % size) * 8 / size);
    const y = Math.floor(Math.floor(index / size) * 8 / size);
    return Number(motif.rows[y][x]);
  });
  const level = generateLevel(id, size, size, palettes[Math.floor((id - 4) / motifs.length)], pixels,
    motif.name, id <= 15 ? Config.levels.earlyCapacity : Config.levels.lateCapacity);
  const solved = solve(level);
  if (solved.status !== 'solvable') throw new Error(`Level ${id} search failed: ${solved.status}`);
  const game = new GameModel(level);
  for (const lane of level.solution!) {
    if (!game.placeCrate(lane)) throw new Error(`Level ${id}: solution placement failed`);
    for (let tick = 0; tick < Config.levels.settleSteps && game.bots.size; tick++) game.update(50);
  }
  if (game.state !== 'Won') throw new Error(`Level ${id}: timed simulation failed`);
  await writeFile(`levels/level_${String(id).padStart(3, '0')}.json`, `${JSON.stringify(level, null, 2)}\n`);
  console.log(`Level ${id}: ${motif.name}, ${size}×${size}, ${level.lanes.flat().length} crates, solvable`);
}
