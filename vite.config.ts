import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const platform = mode === 'development' || mode === 'test' ? 'local' : mode;
  if (!['local', 'poki', 'crazygames'].includes(platform)) {
    throw new Error(`Unsupported build mode: ${mode}`);
  }
  return {
    base: './',
    build: { outDir: `dist/${platform}`, chunkSizeWarningLimit: 1000 },
    define: { __PLATFORM__: JSON.stringify(platform) },
    plugins: platform === 'crazygames' ? [{
      name: 'crazygames-sdk',
      transformIndexHtml: () => [{ tag: 'script', attrs: { src: 'https://sdk.crazygames.com/crazygames-sdk-v3.js' }, injectTo: 'head' as const }],
    }] : [],
  };
});
