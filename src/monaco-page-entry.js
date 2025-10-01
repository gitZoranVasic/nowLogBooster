/** Page-context entry: listens for editor creation requests and delegates to monacoHost. */
import { createEditor, setLightTheme } from './features/messageJson/renderers/monacoHost';

// Ensure theme once
try { setLightTheme(); } catch {}

// Listen for create requests from the content script
window.addEventListener('message', (ev) => {
  if (!ev || !ev.data || ev.source !== window) return;
  const msg = ev.data;
  if (msg.type === 'NOWLOGBOOSTER_CREATE_EDITOR' && msg.editorId) {
    const container = document.querySelector(`[data-nowlogbooster-editor="${msg.editorId}"]`);
    if (container) {
      try {
        createEditor(container, String(msg.jsonContent || ''));
      } catch (e) {
        console.error('NowLogBooster page-bundle: failed creating editor', e);
      }
    }
  }
});

// Signal ready to content script
window.postMessage({ type: 'NOWLOGBOOSTER_MONACO_READY' }, '*');
