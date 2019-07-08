import { Node } from 'acorn'
import { createHash, Hash } from 'crypto'
import { Scope } from '../source/scope'

export enum Relationship {
  PREVIOUS = 'PREVIOUS', // Destination is the previous node of source.
  NEXT = 'NEXT', // Destionation is the next node of source.
  CALLE = 'CALLEE', // Source calling destination.
  CALLED = 'CALLED', // Source is called by destination.
  PROP = 'PROP', // Porperty of source.
  MEMBER = 'MEMBER', // Child of source.
  RETURN = 'RETURN', // Destionation is return of the source.
  RESULT = 'RESULT', // Destination is the result of the source.
  ARG = 'ARG', // Source is argument, equivalent to dst.
  PARAM = 'PARAM' // Dst is a parameter equivalent to source
}

export class StatementNode {
  public id: string
  constructor(public node: Node, public scope: Scope) {
    this.id = hash(node)
  }
}

export class Relation {
  constructor(
    public src: StatementNode,
    public dst: StatementNode,
    public rel: Relationship
  ) {}
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
    if (Object.keys(this.nodes).includes(node.id)) {
      throw new Error(`Duplicated node id: ${node.id}`)
    }

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

  getNode(id: string): StatementNode {
    if (this.nodes[id]) {
      return this.nodes[id]
    }
    throw new Error(`Node with id ${id} does not exist.`)
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
