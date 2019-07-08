import { Scope } from '../scope'
import { Graph } from '../../util/graph'
import { Node } from 'acorn'

type N = Node & any

export interface RegisterProps {
  st: N
  scope: Scope
  graph: Graph
  visitor?: any
}
