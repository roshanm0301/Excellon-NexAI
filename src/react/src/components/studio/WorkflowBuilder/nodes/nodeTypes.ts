import { StartNode } from './StartNode'
import { EndNode } from './EndNode'
import { TaskNode } from './TaskNode'
import { ConditionNode } from './ConditionNode'
import { SwitchNode } from './SwitchNode'

export const nodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  taskNode: TaskNode,
  conditionNode: ConditionNode,
  switchNode: SwitchNode,
  containerNode: TaskNode,
} as const
