import type { NodeTreeItem } from '../../config/studioApi'

export const seedNodes: NodeTreeItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Platform Root',
    node_type: 'platform',
    metadata: {},
  },
  {
    id: '00000000-0000-0000-0000-000000000011',
    name: 'India Automobile',
    node_type: 'vertical',
    parent_id: '00000000-0000-0000-0000-000000000010',
    metadata: { industry: 'Automobile', region: 'India' },
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    name: 'Demo Dealer Pvt Ltd',
    node_type: 'tenant',
    parent_id: '00000000-0000-0000-0000-000000000011',
    metadata: { gstin: '27AAAPD1234A1Z5', state: 'Maharashtra' },
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    name: 'Mumbai Showroom',
    node_type: 'branch',
    parent_id: '00000000-0000-0000-0000-000000000012',
    metadata: { city: 'Mumbai', branchCode: 'MUM-01' },
  },
  {
    id: '00000000-0000-0000-0000-000000000014',
    name: 'Pune Showroom',
    node_type: 'branch',
    parent_id: '00000000-0000-0000-0000-000000000012',
    metadata: { city: 'Pune', branchCode: 'PUN-01' },
  },
]
