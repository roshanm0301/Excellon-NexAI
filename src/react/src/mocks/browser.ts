import { setupWorker } from 'msw/browser'
import { artifactHandlers } from './handlers/artifacts'
import { nodeHandlers } from './handlers/nodes'
import { nlpHandlers } from './handlers/nlp'
import { viewHandlers } from './handlers/views'
import { overlayHandlers } from './handlers/overlays'
import { workflowHandlers } from './handlers/workflowBuilder'

export const worker = setupWorker(
  ...artifactHandlers,
  ...nodeHandlers,
  ...nlpHandlers,
  ...viewHandlers,
  ...overlayHandlers,
  ...workflowHandlers,
)
