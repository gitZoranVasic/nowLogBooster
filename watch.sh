#!/bin/bash

echo "🔄 Starting watch mode for NowLogBooster..."
echo "📦 Initial build..."

# Initial build
npm run build:extension

if [ $? -eq 0 ]; then
    echo "✅ Initial build complete!"
    echo ""
    echo "👀 Watching for changes..."
    echo "💡 Tip: After making changes, manually refresh the extension in chrome://extensions/"
    echo ""
    
    # Watch for file changes
    fswatch -o src/ public/manifest.json | while read f; do
        echo "🔄 Files changed, rebuilding..."
        npm run build:extension
        if [ $? -eq 0 ]; then
            echo "✅ Rebuild complete at $(date)"
        else
            echo "❌ Rebuild failed at $(date)"
        fi
    done
else
    echo "❌ Initial build failed!"
    exit 1
fi