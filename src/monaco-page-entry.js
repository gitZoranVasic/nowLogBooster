import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/min/vs/editor/editor.main.css';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';

// Configure workers for MV3: the MonacoWebpackPlugin wires __webpack_public_path__ so URLs resolve
self.MonacoEnvironment = self.MonacoEnvironment || {};

// Debug: verify JSON language contribution present
try {
  const langs = monaco.languages.getLanguages().map(l => l.id);
  console.log('NowLogBooster page-bundle: languages registered', langs);
} catch {}

// Use the built-in light theme for now (we can add dark later)
try {
  monaco.editor.setTheme('vs');
} catch {}

function createEditorIn(container, value) {
  // Ensure a theme is applied so token colors are visible
  try { monaco.editor.setTheme('vs'); } catch {}

  const editor = monaco.editor.create(container, {
    value,
    language: 'json',
  theme: 'vs',
    readOnly: true,
    automaticLayout: true,
    wordWrap: 'on',
    folding: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    glyphMargin: false,
    renderLineHighlight: 'none',
    overviewRulerLanes: 0,
    scrollBeyondLastLine: false,
    scrollbar: {
      vertical: 'hidden',
      horizontal: 'hidden',
      useShadows: false,
      verticalScrollbarSize: 0,
      horizontalScrollbarSize: 0,
      handleMouseWheel: false,
      alwaysConsumeMouseWheel: false,
    },
  });

  const relayout = () => {
    const h = editor.getContentHeight();
    container.style.height = h + 'px';
    editor.layout({ width: container.clientWidth, height: h });
  };
  relayout();
  editor.onDidContentSizeChange(relayout);
}

// Listen for create requests from the content script
window.addEventListener('message', (ev) => {
  if (!ev || !ev.data || ev.source !== window) return;
  const msg = ev.data;
  if (msg.type === 'NOWLOGBOOSTER_CREATE_EDITOR' && msg.editorId) {
    const container = document.querySelector(`[data-nowlogbooster-editor="${msg.editorId}"]`);
    if (container) {
      try {
        createEditorIn(container, String(msg.jsonContent || ''));
      } catch (e) {
        console.error('NowLogBooster page-bundle: failed creating editor', e);
      }
    }
  }
});

// Signal ready to content script
window.postMessage({ type: 'NOWLOGBOOSTER_MONACO_READY' }, '*');
