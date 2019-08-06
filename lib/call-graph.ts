import { Node } from 'acorn'
import { createHash, Hash } from 'crypto'
import { Scope } from '../source/scope'

export enum Relationship {
  CALL = 'CALL', // Source calls the destination.
  READ = 'READ', // Source reads the destination.
  WRITE = 'WRITE', // Source writes at the destination.
  READ_PROP = 'READ_PROP', // Source reads a property of destination.
  WRITE_PROP = 'WRITE_PROP', // Source writes a property of destination.
  DELETE_PROP = 'DELETE_PROP', // Source deletes a property of destination.
  RETURN = 'RETURN', // Source returns a value to destination.
  ARG = 'ARG' // Source is argument at destination.
}

interface StatementNodeProps {
  node: Node
  scope: Scope
  isTerminal: boolean
  isDeclaration: boolean
}
export class StatementNode {
  public id: string
  public node: Node
  public scope: Scope
  public isTerminal: boolean
  public isDeclaration: boolean

  constructor(props: StatementNodeProps) {
    this.id = hash(props.node)
    this.node = props.node
    this.scope = props.scope
    this.isTerminal = props.isTerminal
    this.isDeclaration = props.isDeclaration
  }
}

export interface Relation {
  src: StatementNode
  dst: StatementNode
  rel: Relationship
}

export function hash(node: Node): string {
  const hasher: Hash = createHash('md5')
  const { type, loc } = node
  const input = JSON.stringify({ type, loc })

  hasher.update(input)
  return hasher.digest('base64')
}

export class Graph {
  private nodes: { [key: string]: StatementNode }
  private edges: Relation[]

  constructor() {
    this.nodes = {}
    this.edges = []
  }

  addNode(node: StatementNode): void {
    if (!Object.keys(this.nodes).includes(node.id))
      // console.error('Original', this.nodes[node.id])
      // console.error('New', node)
      // throw new Error(`Duplicated node id: ${node.id}`)

      this.nodes[node.id] = node
  }

  addEdge(edge: Relation): void {
    const { src, dst } = edge
    const keys = Object.keys(this.nodes)
    if (!keys.includes(src.id)) {
      throw new Error(`Missing source node: ${src.id}`)
    }

    if (!keys.includes(dst.id)) {
      throw new Error(`Missing destination node: ${dst.id}`)
    }

    this.edges.push(edge)
  }

  getNode(id: string | Node): StatementNode {
    let key: string = id as string
    if (id instanceof Node) key = hash(id)
    if (this.nodes[key]) return this.nodes[key]

    throw new Error(`Node with id ${key} does not exist.`)
  }

  getAllNodes(): StatementNode[] {
    return Object.values(this.nodes)
  }

  getEdgeByNode(node: StatementNode): Relation[] {
    const { id } = node

    return this.edges.filter(edge => edge.src.id === id || edge.dst.id === id)
  }

  getAllEdges(): Relation[] {
    return this.edges
  }
}
