import { MockPlatform, type MockScenario } from './MockPlatform';
import type { PlatformSession } from './PlatformSession';
import { Config } from '../core/Config';

export function createDebugPanel(adapter: MockPlatform, session: PlatformSession) {
  const panel = document.createElement('aside');
  panel.className = 'platform-debug';
  panel.hidden = true;
  const title = document.createElement('strong');
  title.textContent = 'Local ad simulator · D to close';
  panel.appendChild(title);
  const result = document.createElement('p');
  result.textContent = 'No portal SDK is loaded.';
  for (const [label, scenario] of [['Ad playing', 'playing'], ['Ad blocked', 'blocked'], ['Reward success', 'rewarded-success'], ['Reward failure', 'rewarded-failure']] as [string, MockScenario][]) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', async () => {
      if (session.isAdPlaying()) return;
      adapter.scenario = scenario;
      result.textContent = 'Simulating…';
      const reward = scenario.startsWith('rewarded') ? await session.rewardedBreak() : (await session.commercialBreak(), false);
      result.textContent = `Finished. Reward granted: ${reward}. Events: ${adapter.log.slice(-6).join(' → ')}`;
    });
    panel.appendChild(button);
  }
  panel.appendChild(result);
  const reset = document.createElement('button');
  reset.textContent = 'Reset progress';
  reset.addEventListener('click', async () => {
    if (session.isAdPlaying()) return;
    await session.saveData(Config.progressKey, '0');
    location.reload();
  });
  panel.appendChild(reset);
  document.querySelector('#app')!.appendChild(panel);
  return { toggle: () => { panel.hidden = !panel.hidden; }, dispose: () => panel.remove() };
}
