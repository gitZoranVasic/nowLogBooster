import React from 'react'
import { createRoot } from 'react-dom/client'

const PopupPage: React.FC = () => {
  return (
    <div style={{ width: '300px', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#0066cc', marginTop: 0 }}>NowLogBooster</h2>
      <p>Chrome extension for enhancing ServiceNow JSON logs with Monaco Editor.</p>
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Open Options
        </button>
      </div>
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <p>Visit a ServiceNow syslog_list.do page to see the extension in action!</p>
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<PopupPage />)
}

export { PopupPage }