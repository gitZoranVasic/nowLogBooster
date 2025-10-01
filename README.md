# NowLogBooster

A minimal Chrome extension that highlights JSON content in ServiceNow syslog pages.

## Getting started

```bash
npm run build
```

Load the generated `dist/` folder as an unpacked extension in `chrome://extensions/`.

## How it works

- `src/contentScript.js` finds JSON blobs inside the syslog message column and highlights them with red borders
- `npm run build` copies the content script and manifest.json into `dist/`
- No dependencies, no bundlers, no frameworks - just vanilla JavaScript

## Development

1. Make changes to `src/contentScript.js` or `extension/manifest.json`
2. Run `npm run build`
3. Reload the extension in `chrome://extensions/`
4. Test on a ServiceNow syslog page

