/**
 * Page-context Monaco host utilities.
 * createEditor(container, value): mounts a read-only JSON editor with auto-height.
 */
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-editor/min/vs/editor/editor.main.css';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';

export function setLightTheme() {
  try { monaco.editor.setTheme('vs'); } catch {}
}

/**
 * Create a JSON read-only editor with auto-height inside container.
 * @param {HTMLElement} container
 * @param {string} value
 */
export function createEditor(container, value) {
  setLightTheme();
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
  return editor;
}
