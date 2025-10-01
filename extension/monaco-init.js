// This script runs in the page context to initialize Monaco
(function() {
  console.log('NowLogBooster: Monaco init script loaded in page context');
  
  // Function to set up editor creation listener
  function setupEditorListener() {
    window.addEventListener('message', function(event) {
      if (event.source !== window) return;
      if (event.data.type === 'NOWLOGBOOSTER_CREATE_EDITOR') {
        var container = document.getElementById(event.data.editorId);
        if (container && window.monaco) {
          try {
            var editor = monaco.editor.create(container, {
              value: event.data.jsonContent,
              language: 'json',
              theme: 'vs-dark',
              readOnly: true,
              minimap: { enabled: false },
              automaticLayout: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false
            });
            console.log('NowLogBooster: Created Monaco editor:', event.data.editorId);
          } catch (error) {
            console.error('NowLogBooster: Failed to create Monaco editor:', error);
          }
        }
      }
    });
  }
  
  // Check if Monaco is already loaded
  if (typeof monaco !== 'undefined' && window.monaco) {
    console.log('NowLogBooster: Monaco already loaded, signaling ready');
    window.postMessage({ type: 'NOWLOGBOOSTER_MONACO_READY' }, '*');
    setupEditorListener();
    return;
  }
  
  // Check if we're already in the process of loading Monaco
  if (window.__nowLogBoosterMonacoLoading) {
    console.log('NowLogBooster: Monaco already loading, waiting...');
    return;
  }
  window.__nowLogBoosterMonacoLoading = true;
  
  // Wait for require to be fully loaded
  if (typeof require === 'undefined' || !require.config) {
    console.log('NowLogBooster: Waiting for require to load...');
    setTimeout(arguments.callee, 50);
    return;
  }
  
  // Get the Monaco URL from the script tag's data attribute
  var scriptTag = document.querySelector('script[data-monaco-url]');
  var monacoUrl = scriptTag ? scriptTag.dataset.monacoUrl : null;
  
  if (!monacoUrl) {
    console.error('NowLogBooster: Monaco URL not found');
    return;
  }
  
  console.log('NowLogBooster: Configuring Monaco with URL:', monacoUrl);
  
  // Check if already configured
  try {
    var existingConfig = require.s && require.s.contexts && require.s.contexts._ && require.s.contexts._.config;
    if (existingConfig && existingConfig.paths && existingConfig.paths.vs) {
      console.log('NowLogBooster: Monaco config already exists, skipping reconfiguration');
      if (existingConfig.paths.vs === monacoUrl) {
        // Same config, just load
        require(['vs/editor/editor.main'], function() {
          console.log('NowLogBooster: Monaco editor ready (existing config)');
          window.postMessage({ type: 'NOWLOGBOOSTER_MONACO_READY' }, '*');
          setupEditorListener();
        });
      } else {
        console.warn('NowLogBooster: Different Monaco config detected, cannot load');
      }
      return;
    }
  } catch (e) {
    console.log('NowLogBooster: Could not check existing config:', e);
  }
  
  // First time setup - wrap in try/catch
  try {
    console.log('NowLogBooster: Configuring Monaco for the first time');
    require.config({ paths: { 'vs': monacoUrl } });
    
    // Add error handler
    require.onError = function(err) {
      console.error('NowLogBooster: Monaco loading error:', err);
    };
    
    require(['vs/editor/editor.main'], function() {
      console.log('NowLogBooster: Monaco editor ready in page context');
      window.postMessage({ type: 'NOWLOGBOOSTER_MONACO_READY' }, '*');
      setupEditorListener();
    });
  } catch (error) {
    console.error('NowLogBooster: Failed to configure Monaco:', error);
  }
})();
