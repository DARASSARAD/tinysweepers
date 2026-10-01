import { createPreview } from './view/App';
import './style.css';

createPreview().catch((error: unknown) => {
  console.error('Tiny Sweepers could not start:', error);
  const message = document.createElement('p');
  message.className = 'boot-error';
  message.textContent = 'The game could not start. Please reload in a browser with WebGL enabled.';
  document.querySelector('#app')?.appendChild(message);
});
