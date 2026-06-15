import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { mockService } from './mockService'

export const worker = setupWorker(...handlers)

export async function startMockServer(): Promise<void> {
  try {
    mockService.init()

    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    })

    console.log('%c[MSW] Mock API server started', 'color: #10b981; font-weight: bold')
    console.log('  • API base: /api/*')
    console.log('  • Supplements: 16 endpoints')
    console.log('  • Returns: 12 endpoints')
    console.log('  • Health check: GET /api/mock/health')
    console.log('  • Reset data: POST /api/mock/reset')
  } catch (e) {
    console.error('[MSW] Failed to start mock server:', e)
  }
}
