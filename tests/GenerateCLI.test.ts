import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { expect, it } from 'vitest';
import { validate, type LevelData } from '../src/logic/LevelData';
import { solve } from '../src/logic/Solver';

it('turns a PNG into a validated, solvable JSON level with one command', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'tiny-sweepers-cli-'));
  const input = join(scratch, 'picture.png');
  const output = join(scratch, 'level.json');
  try {
    const image = new PNG({ width: 8, height: 8 });
    for (let i = 0; i < 64; i++) {
      const inner = i % 8 > 1 && i % 8 < 6 && Math.floor(i / 8) > 1 && Math.floor(i / 8) < 6;
      image.data.set(inner ? [240, 160, 80, 255] : [80, 180, 160, 255], i * 4);
    }
    writeFileSync(input, PNG.sync.write(image));
    const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'tools/level-generator/index.ts', input,
      '--size', '8', '--colors', '4', '--id', '31', '--output', output], { encoding: 'utf8', timeout: 10000 });
    expect(result.status, result.stderr).toBe(0);
    const level = JSON.parse(readFileSync(output, 'utf8')) as LevelData;
    expect(() => validate(level)).not.toThrow();
    expect(solve(level).status).toBe('solvable');
  } finally {
    if (existsSync(input)) unlinkSync(input);
    if (existsSync(output)) unlinkSync(output);
    rmdirSync(scratch);
  }
});
