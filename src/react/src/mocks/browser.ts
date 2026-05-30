import { setupWorker } from 'msw/browser'
import { artifactHandlers } from './handlers/artifacts'
import { nodeHandlers } from './handlers/nodes'
import { nlpHandlers } from './handlers/nlp'

export const worker = setupWorker(
  ...artifactHandlers,
  ...nodeHandlers,
  ...nlpHandlers,
)
