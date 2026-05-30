export async function setupMocks() {
  const { worker } = await import('./browser')
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${base}/mockServiceWorker.js` },
  })
}
