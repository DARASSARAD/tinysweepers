import { build, createServer } from 'vite';

const action = process.argv[2];
const args = process.argv.slice(3);
const modeIndex = args.indexOf('--mode');
const platform = modeIndex < 0 ? 'local' : args[modeIndex + 1];
if (!['local', 'poki', 'crazygames'].includes(platform)) throw new Error('Unsupported platform');
const mode = platform === 'local' ? 'development' : platform;
if (action === 'build') await build({ mode });
else if (action === 'dev') {
  const server = await createServer({ mode, server: { host: '127.0.0.1' } });
  await server.listen();
  server.printUrls();
} else throw new Error('Unknown Vite action');
