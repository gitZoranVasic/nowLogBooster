# NowLogBooster - Chrome Extension for ServiceNow JSON Log Enhancement

## Project Overview
Chrome extension that enhances ServiceNow `syslog_list.do` pages by embedding Monaco Editor for improved JSON log viewing. **Monaco Editor integration is a mandatory core feature** - the extension's primary purpose is to replace plain text JSON in ServiceNow logs with fully-featured Monaco Editor instances for syntax highlighting, folding, and better readability.

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

### Architecture Requirements
**MANDATORY**: Monaco Editor must be successfully integrated and working
- Monaco Editor is the core feature - not optional
- Must handle ServiceNow's strict Content Security Policy (CSP)
- Must work within Chrome extension content script isolation
- Must support JSON syntax highlighting, code folding, and auto-sizing

**Current Structure**:
- `src/contentScript-simple.js` - Main content script with Monaco integration
- `extension/manifest.json` - Chrome extension manifest v3
- `scripts/build.js` - Simple Node.js build without bundlers

## Development Workflows

### Essential Commands
```bash
npm run build           # Build complete Chrome extension
```

### Extension Development Cycle
1. **Make changes** to files in `src/`
2. **Build**: `npm run build`
3. **Reload**: Refresh extension in `chrome://extensions/`
4. **Test**: Visit ServiceNow syslog_list.do page

### Build Process
- Simple Node.js script copies files without bundling
- No TypeScript compilation - using plain JavaScript
- Load `dist/` folder as unpacked extension in Chrome

### Current Working Features
- ✅ Content script injects blue button on ServiceNow syslog pages
- ✅ Chrome extension manifest v3 with proper permissions
- ❌ **Monaco Editor integration blocked by CSP** - THIS IS THE CRITICAL ISSUE TO RESOLVE

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
- Build system configured for multi-entry extension development
- Ready for Monaco Editor integration and JSON log enhancement

🚧 **CRITICAL BLOCKER**: Monaco Editor CSP Integration
- ServiceNow's Content Security Policy blocks external Monaco CDN scripts
- Need to find CSP-compliant way to load Monaco Editor
- This is the core feature - extension is incomplete without working Monaco integration