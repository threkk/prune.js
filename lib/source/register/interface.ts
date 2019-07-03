import { Scope } from '../scope'
import { Graph } from '../../util/graph'
import { Node } from 'acorn'

export interface RegisterProps {
  st: Node
  scope: Scope
  graph: Graph
  visitor?: any
}
