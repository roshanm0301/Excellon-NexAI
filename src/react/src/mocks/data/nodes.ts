import type { NodeTreeItem } from '../../config/studioApi'

export const seedNodes: NodeTreeItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000200',
    name: 'Platform Root',
    node_type: 'platform',
    metadata: { description: 'Top-level platform node' },
    children: [
      {
        id: '00000000-0000-0000-0000-000000000201',
        parent_id: '00000000-0000-0000-0000-000000000200',
        name: 'Manufacturing Vertical',
        node_type: 'vertical',
        metadata: { industry: 'Manufacturing', region: 'Global' },
        children: [
          {
            id: '00000000-0000-0000-0000-000000000202',
            parent_id: '00000000-0000-0000-0000-000000000201',
            name: 'Acme Corp',
            node_type: 'tenant',
            metadata: { country: 'US', plan: 'enterprise', contactEmail: 'admin@acme.com' },
            children: [],
          },
          {
            id: '00000000-0000-0000-0000-000000000203',
            parent_id: '00000000-0000-0000-0000-000000000201',
            name: 'Globex Industries',
            node_type: 'tenant',
            metadata: { country: 'DE', plan: 'professional', contactEmail: 'admin@globex.de' },
            children: [],
          },
        ],
      },
    ],
  },
]
