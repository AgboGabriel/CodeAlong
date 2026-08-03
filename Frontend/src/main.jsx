import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './Components/ErrorBoundary'

// Global handlers to catch async errors that might otherwise leave a blank page
window.addEventListener('error', (e) => {
  console.error('window error', e.error || e.message, e);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('unhandledrejection', e.reason || e);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
