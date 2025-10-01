# NowLogBooster - Chrome Extension for ServiceNow JSON Log Enhancement

## Project Overview
Chrome extension that enhances ServiceNow `syslog_list.do` pages by embedding Monaco Editor for improved JSON log viewing. Currently in early development phase with basic Vite + React + TypeScript setup.

## Architecture & Key Files

### Chrome Extension Structure
- `public/manifest.json` - Extension manifest (v3) with ServiceNow host permissions and content script injection
- Target URL pattern: `*://*.service-now.com/syslog_list.do*`
- Content script injection at `document_idle` to scan for JSON logs in Message cells

### Development Stack
- **Build System**: Vite 7.x with React plugin for HMR during development
- **Framework**: React 19.x with TypeScript 5.8.x in strict mode
- **Monaco Editor**: `@monaco-editor/react` for JSON syntax highlighting and editing
- **Extension APIs**: `@types/chrome` for Chrome extension type definitions

### Current vs. Planned Structure
**Current**: Standard Vite React template in `src/` (App.tsx, main.tsx)
**Planned** (see `filestructure` file):
- `src/contentScript.tsx` - Main content script entry point
- `src/components/JSONViewer.tsx` - Monaco Editor wrapper component  
- `src/options/` - Extension options page
- `src/popup/` - Extension popup interface
- `src/background.ts` - Service worker (future use)

## Development Workflows

### Essential Commands
```bash
npm run build:extension  # Build complete Chrome extension (recommended)
./dev-setup.sh          # One-time setup with instructions
npm run build           # TypeScript + Vite build only
npm run lint            # ESLint validation
```

### Extension Development Cycle
1. **Make changes** to files in `src/`
2. **Build**: `npm run build:extension`
3. **Reload**: Refresh extension in `chrome://extensions/`
4. **Test**: Visit ServiceNow syslog_list.do page

### Build Process
- Multi-entry Vite config builds: contentScript, popup, options
- Copies manifest.json and HTML files to `dist/`
- TypeScript compilation first, then bundling
- Load `dist/` folder as unpacked extension in Chrome

### Current Working Features
- ✅ Content script injects blue button on ServiceNow syslog pages
- ✅ Popup and options pages with React components
- ✅ Chrome extension manifest v3 with proper permissions

## Project-Specific Patterns

### TypeScript Configuration
- Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`
- `verbatimModuleSyntax: true` - explicit import/export syntax required
- `moduleDetection: "force"` - all files treated as modules

### ESLint Setup
- Modern ESLint 9.x flat config (`eslint.config.js`)
- React Hooks plugin with `recommended-latest` rules
- React Refresh plugin for Vite HMR compatibility
- Global ignores: `['dist']`

### Extension-Specific Considerations
- Content scripts run in isolated context - need careful DOM manipulation
- ServiceNow pages may have dynamic content requiring MutationObserver patterns
- Monaco Editor needs proper CSP headers for ServiceNow compatibility
- Storage API usage for user preferences (URL patterns, editor settings)

## Integration Points
- **ServiceNow**: Content script injection into existing DOM structure
- **Monaco Editor**: Embed editors within ServiceNow table cells
- **Chrome APIs**: Storage, content script injection, host permissions
- **React**: Component-based architecture for options/popup interfaces

## Current Development Status
✅ **Working**: Basic Chrome extension with content script injection
- Content script adds test button to ServiceNow syslog pages
- React-based popup and options pages functional
- Build system configured for multi-entry extension development
- Ready for Monaco Editor integration and JSON log enhancement

🚧 **Next**: Implement JSON log detection and Monaco Editor replacement