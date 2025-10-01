# NowLogBooster Development Guide

## Quick Start

1. **Build the extension:**
   ```bash
   npm run build:extension
   ```
   Or use the convenience script:
   ```bash
   ./dev-setup.sh
   ```

2. **Load into Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the `dist/` folder
   - The extension should appear in your extensions list

3. **Test the extension:**
   - Navigate to any ServiceNow instance
   - Go to a syslog_list.do page (e.g., `https://yourinstance.service-now.com/syslog_list.do`)
   - You should see a blue "NowLogBooster" button in the top-right corner
   - Click it to confirm the extension is working

## Development Workflow

### Making Changes
1. Edit files in `src/` directory
2. Run `npm run build:extension` to rebuild
3. Go to `chrome://extensions/` and click the refresh icon on your extension
4. Reload any ServiceNow pages to see changes

### File Structure
- `src/contentScript.tsx` - Main content script that injects into ServiceNow pages
- `src/popup/main.tsx` - Extension popup (click extension icon)
- `src/options/main.tsx` - Options page (right-click extension → Options)
- `public/manifest.json` - Chrome extension configuration
- `dist/` - Built extension files (load this folder in Chrome)

### Scripts
- `npm run build:extension` - Build extension for Chrome
- `npm run watch` - Initial build + instructions for development
- `npm run lint` - Run ESLint
- `./dev-setup.sh` - One-time setup script with instructions

## Current Features
- ✅ Basic content script injection on ServiceNow syslog pages
- ✅ Test button that appears on matching pages
- ✅ Popup and options pages (basic UI)
- ✅ Chrome extension manifest v3 configuration

## Next Steps
- 🚧 Add Monaco Editor integration
- 🚧 Scan for JSON content in log messages
- 🚧 Replace text areas with Monaco editors
- 🚧 Add syntax highlighting and formatting

## Troubleshooting
- **Extension not loading:** Check `chrome://extensions/` for error messages
- **Button not appearing:** Ensure you're on a `syslog_list.do` page
- **Build failures:** Run `npm install` and ensure all dependencies are installed
- **TypeScript errors:** Check console for specific issues, ensure types are correct