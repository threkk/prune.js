import { Node } from 'acorn'
import { createHash, Hash } from 'crypto'

export enum Relationship {
  CALL = 'CALL', // Source calls the destination.
  READ = 'READ', // Source reads the destination.
  WRITE = 'WRITE', // Source writes at the destination.
  READ_PROP = 'READ_PROP', // Source reads a property of destination.
  WRITE_PROP = 'WRITE_PROP', // Source writes a property of destination.
  DELETE_PROP = 'DELETE_PROP', // Source deletes a property of destination.
  RETURN = 'RETURN', // Source returns a value to destination.
  ARG = 'ARG', // Source is argument at destination.
  PARAM = 'PARAM', // Source is a parameter at destination.
  DECL = 'DECL' // Source is the declaration of destination.
}

interface StatementNodeProps {
  node: Node
  isTerminal: boolean
  isDeclaration: boolean
}
export class StatementNode {
  id: string
  node: Node
  isTerminal: boolean
  isDeclaration: boolean

  constructor(props: StatementNodeProps) {
    this.id = hash(props.node)
    this.node = props.node
    this.isTerminal = props.isTerminal
    this.isDeclaration = props.isDeclaration
  }

  toString(): string {
    return `"${this.node.loc.start.line}:${this.node.loc.start.column},${this.node.loc.end.line},${this.node.loc.end.column}_${this.node.type}"`
  }
}

export interface RelationProps {
  src: StatementNode | Node
  dst: StatementNode | Node
  rel: Relationship
  var?: string
  index?: number
}

interface Relation extends RelationProps {
  src: StatementNode
  dst: StatementNode
}

export function hash(node: Node): string {
  const hasher: Hash = createHash('md5')
  const { type, loc } = node
  const input = JSON.stringify({ type, loc })

  hasher.update(input)
  return hasher.digest('base64')
}

function isNode(x: StatementNode | Node): x is Node {
  return x instanceof Node
}

export class Graph {
  #nodes: Map<string, StatementNode>
  #edges: Relation[]

  constructor() {
    this.#nodes = new Map()
    this.#edges = []
  }

  addNode(node: StatementNode | Node): void {
    const n: StatementNode = isNode(node)
      ? new StatementNode({
          node,
          isDeclaration: /Declaration/.test(node.type),
          isTerminal: false
        })
      : node

    if (!this.#nodes.has(n.id)) {
      // console.error('Original', this.nodes[node.id])
      // console.error('New', node)
      // throw new Error(`Duplicated node id: ${node.id}`)

      this.#nodes.set(n.id, n)
    }
  }

  addEdge(edge: RelationProps): void {
    const src: StatementNode = isNode(edge.src)
      ? this.getNode(edge.src)
      : edge.src
    const dst: StatementNode = isNode(edge.dst)
      ? this.getNode(edge.dst)
      : edge.dst

    if (!src || !this.#nodes.has(src.id)) {
      throw new Error(`Missing source node: ${src.id}`)
    }

    if (!dst || !this.#nodes.has(dst.id)) {
      throw new Error(`Missing destination node: ${dst.id}`)
    }

    this.#edges.push({
      src,
      dst,
      rel: edge.rel,
      index: edge.index,
      var: edge.var
    })
  }

  getNode(id: string | Node): StatementNode {
    let key: string = id as string
    if (id instanceof Node) key = hash(id)
    if (this.#nodes.has(key)) return this.#nodes.get(key)
    return null
    // throw new Error(`Node with id ${key} does not exist.`)
  }

  getAllNodes(): StatementNode[] {
    return [...this.#nodes.values()]
  }

  getEdgeByNode(node: StatementNode): Relation[] {
    const { id } = node

    return this.#edges.filter(edge => edge.src.id === id || edge.dst.id === id)
  }

  getAllEdges(): Relation[] {
    return this.#edges
  }

  getEdgesLength(): number {
    return this.#edges.length
  }

  getNodesSize(): number {
    return this.#nodes.size
  }

  toString(): string {
    const nodes: string = this.getAllNodes().join(';')
    const edges: string = this.#edges
      .map(
        edge =>
          `${edge.src} -> ${edge.dst} [label="rel=${edge.rel}${
            edge.var != null ? ',var=' + edge.var : ''
          }${edge.index != null ? ',idx=' + edge.index : ''}"]`
      )
      .join(';')
    return `digraph { ${nodes}; ${edges} }`
  }
}
