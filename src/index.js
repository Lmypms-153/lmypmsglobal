import React from 'react'
import ReactDOM from 'react-dom/client'

async function loadApp() {
  const { default: App } = await import('../App')
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(<React.StrictMode><App /></React.StrictMode>)
}

loadApp()
