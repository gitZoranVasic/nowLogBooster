# NowLogBooster

A minimal ServiceNow helper extension that prettifies JSON log entries with Monaco Editor.

## Getting started

```bash
npm install
npm run build
```

Load the generated `dist/` folder as an unpacked extension in `chrome://extensions/`.

## How it works

- `src/contentScript.js` finds JSON blobs inside the syslog message column and replaces them with Monaco-powered viewers.
- `npm run build` copies the content script, the extension assets in `extension/`, and the pre-bundled Monaco files into `dist/`.
- `extension/editor.html` hosts Monaco Editor in an isolated iframe so it can run without a bundler or React/TypeScript tooling.
