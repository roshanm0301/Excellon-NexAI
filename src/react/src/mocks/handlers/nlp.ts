import { http, HttpResponse } from 'msw'

export const nlpHandlers = [
  http.post('/api/v1/nlp/chat', async ({ request }) => {
    const body = await request.json() as { message: string }
    return HttpResponse.json({
      message: `I can help you design entities and expressions. You asked: "${body.message}". Try describing the fields you need and I can suggest a schema.`,
      suggestions: [
        'Add a "status" field with values: active, inactive',
        'Add a "createdDate" datetime field',
        'Add a "description" text field',
      ],
    })
  }),

  http.post('/api/v1/nlp/import', async ({ request }) => {
    const body = await request.json() as { text: string }
    // Parse simple field hints from the text
    const words = body.text.split(/\s+/).slice(0, 5)
    const fields = words.map(w => ({
      name: w.toLowerCase().replace(/[^a-z0-9]/g, ''),
      type: 'text',
      required: false,
      description: `Field derived from: ${w}`,
    })).filter(f => f.name.length > 0)
    return HttpResponse.json({ fields: fields.length > 0 ? fields : [{ name: 'name', type: 'text', required: true }] })
  }),

  http.post('/api/v1/nlp/workflow-generate', async () => {
    await new Promise(r => setTimeout(r, 600))
    return HttpResponse.json({
      properties: {
        globalSettings: {
          systemName: 'generatedWorkflow',
          displayName: 'Generated Workflow',
          description: 'AI-generated workflow',
          actionType: 'process',
          method: 'POST',
          state: [],
          cache: { enabled: false, ttlSeconds: 300 },
          dlq: { enabled: false, topic: '' },
        },
      },
      sequence: [
        {
          id: 'start',
          name: 'Start',
          type: 'start',
          componentType: 'task',
          properties: { taskSettings: {} },
        },
        {
          id: 'fetchDocument',
          name: 'Fetch Document',
          type: 'Document',
          componentType: 'task',
          properties: { taskSettings: { operation: 'FindOne', entity: 'record' } },
        },
        {
          id: 'sendResponse',
          name: 'Send Response',
          type: 'Response',
          componentType: 'task',
          properties: { taskSettings: { status: 200, message: 'OK', data: '$.fetchDocument.data' } },
        },
        {
          id: 'end',
          name: 'End',
          type: 'end',
          componentType: 'task',
          properties: { taskSettings: {} },
        },
      ],
    })
  }),

  http.post('/api/v1/nlp/workflow-explain', async () => {
    return HttpResponse.json({
      explanation:
        'This workflow fetches a record from the database, validates the data, and returns a structured response. It runs as a read-only GET operation and exits cleanly after the response step.',
    })
  }),

  http.post('/api/v1/nlp/workflow-improve', async () => {
    return HttpResponse.json({
      suggestions: [
        {
          severity: 'warning',
          title: 'Missing error handling',
          description:
            'Add a Condition node after each Document step to handle the case where the record is not found.',
        },
        {
          severity: 'info',
          title: 'Consider caching',
          description:
            'If this workflow is called frequently with the same inputs, enable caching in Global Settings to improve performance.',
        },
      ],
    })
  }),
]
