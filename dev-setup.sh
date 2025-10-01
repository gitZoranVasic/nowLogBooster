#!/bin/bash

# Development script for NowLogBooster Chrome Extension
echo "🚀 Starting NowLogBooster development setup..."

# Build the extension
echo "📦 Building extension..."
npm run build:extension

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Open Chrome and go to: chrome://extensions/"
    echo "2. Enable 'Developer mode' (toggle in top right)"
    echo "3. Click 'Load unpacked' and select the 'dist' folder"
    echo "4. Navigate to any ServiceNow syslog_list.do page to test"
    echo ""
    echo "🔄 For auto-reload during development:"
    echo "   Run: npm run watch"
    echo "   Then manually refresh the extension in chrome://extensions/"
    echo ""
    echo "🎯 Test URL pattern: *://*.service-now.com/syslog_list.do*"
else
    echo "❌ Build failed!"
    exit 1
fi