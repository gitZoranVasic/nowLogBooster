document.addEventListener('DOMContentLoaded', () => {
  const vsBase = chrome.runtime.getURL('monaco/vs');

  require.config({ paths: { vs: vsBase } });

  require(['vs/editor/editor.main'], () => {
    const container = document.getElementById('editor-root');

    const editor = monaco.editor.create(container, {
      value: '{\n  "message": "Loading JSON..."\n}',
      language: 'json',
      theme: 'vs-dark',
      readOnly: false,
      wordWrap: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      automaticLayout: true,
      // Explicitly disable features that require workers
      'semanticHighlighting.enabled': false
    });

    const resizeObserver = new ResizeObserver(() => editor.layout());
    resizeObserver.observe(document.body);

    window.addEventListener('message', (event) => {
      if (event.source !== window.parent) return;
      const { type, payload } = event.data || {};
      if (type === 'nowlogbooster:set-json') {
        const text = typeof payload?.text === 'string' ? payload.text : '';
        editor.setValue(text);
        if (typeof payload?.readOnly === 'boolean') {
          editor.updateOptions({ readOnly: payload.readOnly });
        }
      }
    });

    window.parent.postMessage({ type: 'nowlogbooster:ready' }, '*');
  });
});
