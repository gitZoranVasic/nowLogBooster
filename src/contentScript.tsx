import React from 'react'
import { createRoot } from 'react-dom/client'

// Simple button component
const NowLogButton: React.FC = () => {
  const handleClick = () => {
    alert('NowLogBooster is working! 🚀')
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        padding: '10px 15px',
        backgroundColor: '#0066cc',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}
    >
      NowLogBooster
    </button>
  )
}

// Function to inject our button into the page
function injectButton() {
  console.log('NowLogBooster: Injecting button into page')
  
  // Check if we're on a ServiceNow syslog page
  const isServiceNowPage = window.location.hostname.includes('service-now.com')
  const isSyslogPage = window.location.pathname.includes('syslog_list.do')
  
  if (!isServiceNowPage || !isSyslogPage) {
    console.log('NowLogBooster: Not on a ServiceNow syslog page, skipping injection')
    return
  }

  // Create container for our React component
  const container = document.createElement('div')
  container.id = 'nowlogbooster-container'
  document.body.appendChild(container)

  // Render the button
  const root = createRoot(container)
  root.render(<NowLogButton />)
  
  console.log('NowLogBooster: Button successfully injected!')
}

// Wait for the page to load and then inject our button
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectButton)
} else {
  injectButton()
}

// Also listen for any navigation changes (ServiceNow uses AJAX navigation)
let currentUrl = window.location.href
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href
    console.log('NowLogBooster: Page navigation detected, re-injecting button')
    
    // Remove existing button
    const existingContainer = document.getElementById('nowlogbooster-container')
    if (existingContainer) {
      existingContainer.remove()
    }
    
    // Re-inject after a short delay to allow page to load
    setTimeout(injectButton, 1000)
  }
}, 1000)