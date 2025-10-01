import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

const OptionsPage: React.FC = () => {
  const [enabled, setEnabled] = useState(true)
  const [urlPattern, setUrlPattern] = useState('*://*.service-now.com/syslog_list.do*')

  useEffect(() => {
    // Load saved settings
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['enabled', 'urlPattern'], (result) => {
        if (result.enabled !== undefined) setEnabled(result.enabled)
        if (result.urlPattern) setUrlPattern(result.urlPattern)
      })
    }
  }, [])

  const saveSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ enabled, urlPattern }, () => {
        alert('Settings saved!')
      })
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0066cc' }}>NowLogBooster Options</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enable NowLogBooster
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          URL Pattern:
        </label>
        <input
          type="text"
          value={urlPattern}
          onChange={(e) => setUrlPattern(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
          Use * for wildcards. Default: *://*.service-now.com/syslog_list.do*
        </small>
      </div>

      <button
        onClick={saveSettings}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Save Settings
      </button>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Development Status</h3>
        <p>This is a basic development setup. The extension currently:</p>
        <ul>
          <li>✅ Injects a test button on ServiceNow pages</li>
          <li>🚧 Monaco Editor integration (coming soon)</li>
          <li>🚧 JSON log enhancement (coming soon)</li>
        </ul>
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<OptionsPage />)
}

export { OptionsPage }