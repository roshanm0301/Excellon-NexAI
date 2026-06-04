import type { Node, Edge } from '@xyflow/react'

const COL_GAP = 260  // horizontal spacing between columns
const ROW_GAP = 140  // vertical spacing between ranks (rows)

/**
 * applyAutoLayout — BFS-based auto-layout for workflow nodes.
 *
 * Assigns each node a rank (depth from start) and a column (x-position
 * within its rank), then sets absolute positions:
 *   x = column * COL_GAP
 *   y = rank * ROW_GAP
 *
 * Returns updated nodes with new `position` values.
 */
export function applyAutoLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes

  // Build adjacency: nodeId -> list of successor nodeIds
  const successors = new Map<string, string[]>()
  for (const node of nodes) {
    successors.set(node.id, [])
  }
  for (const edge of edges) {
    const list = successors.get(edge.source) ?? []
    list.push(edge.target)
    successors.set(edge.source, list)
  }

  // Find the start node
  const startNode =
    nodes.find(n => n.data.taskType === 'start') ?? nodes[0]

  // BFS to assign rank and column index within each rank
  const rankMap = new Map<string, number>()   // nodeId -> rank (row)
  const colMap = new Map<string, number>()    // nodeId -> col within rank
  const rankCount = new Map<number, number>() // rank -> number of nodes placed so far

  const queue: string[] = [startNode.id]
  rankMap.set(startNode.id, 0)

  const visited = new Set<string>([startNode.id])

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentRank = rankMap.get(current) ?? 0

    for (const next of successors.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next)
        rankMap.set(next, currentRank + 1)
        queue.push(next)
      }
    }
  }

  // Any nodes not reached by BFS (disconnected) get placed at a high rank
  let maxRank = 0
  for (const r of rankMap.values()) {
    if (r > maxRank) maxRank = r
  }
  for (const node of nodes) {
    if (!rankMap.has(node.id)) {
      maxRank++
      rankMap.set(node.id, maxRank)
    }
  }

  // Group nodes by rank and assign column indices (order within rank)
  const rankGroups = new Map<number, string[]>()
  for (const [nodeId, rank] of rankMap.entries()) {
    const group = rankGroups.get(rank) ?? []
    group.push(nodeId)
    rankGroups.set(rank, group)
  }

  for (const [rank, group] of rankGroups.entries()) {
    group.forEach((nodeId, idx) => {
      colMap.set(nodeId, idx)
      rankCount.set(rank, group.length)
    })
  }

  // Compute final positions — centre each rank horizontally
  return nodes.map(node => {
    const rank = rankMap.get(node.id) ?? 0
    const col = colMap.get(node.id) ?? 0
    const totalInRank = rankCount.get(rank) ?? 1

    // Centre the row: shift left by half the total row width
    const rowWidth = (totalInRank - 1) * COL_GAP
    const x = col * COL_GAP - rowWidth / 2 + 300 // +300 to keep viewport centred

    const y = rank * ROW_GAP + 50

    return {
      ...node,
      position: { x, y },
      style: {
        ...(node.style ?? {}),
        opacity: 1,
      },
    }
  })
}
