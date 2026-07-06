import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { ErrorBoundary } from './components/ErrorBoundary'
import { QueryErrorToast } from './components/QueryErrorToast'
import { ConnectionBanner } from './components/ConnectionBanner'
import './index.css'
import App from './App.tsx'
import { TooltipProvider } from './components/ui/tooltip'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <NuqsAdapter>
            <TooltipProvider delayDuration={0}>
              <ConnectionBanner />
              <App />
              <QueryErrorToast />
            </TooltipProvider>
          </NuqsAdapter>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('Service worker registered with scope:', reg.scope)

      // Detect when a new service worker has taken over and reload
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })

      // Check for updates periodically (every 60 min) and on visibility change
      const checkUpdate = () => reg.update().catch(() => {})
      setInterval(checkUpdate, 60 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkUpdate()
      })
    }).catch((err) => console.error('Service worker registration failed:', err))
  })
}
