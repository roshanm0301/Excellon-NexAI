export async function setupMocks() {
  const { worker } = await import('./browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}
