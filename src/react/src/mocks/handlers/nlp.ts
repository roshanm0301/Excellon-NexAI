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
]
