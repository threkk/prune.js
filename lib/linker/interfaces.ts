import { Scope } from '../scope'
import { Graph } from '../call-graph'

export interface LinkProps {
  statement: any
  graph: Graph
  scope: Scope
}
