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
  DECL = 'DECL' // Source is the declaration of destination.
}

interface StatementNodeProps {
  node: Node
  isTerminal: boolean
  isDeclaration: boolean
}
export class StatementNode {
  public id: string
  public node: Node
  public isTerminal: boolean
  public isDeclaration: boolean

  constructor(props: StatementNodeProps) {
    this.id = hash(props.node)
    this.node = props.node
    this.isTerminal = props.isTerminal
    this.isDeclaration = props.isDeclaration
  }
}

export interface Relation {
  src: StatementNode
  dst: StatementNode
  rels: Relationship[]
}

export function hash(node: Node): string {
  const hasher: Hash = createHash('md5')
  const { type, loc } = node
  const input = JSON.stringify({ type, loc })

  hasher.update(input)
  return hasher.digest('base64')
}

export class Graph {
  #nodes: Map<string, StatementNode>
  #edges: Relation[]

  constructor() {
    this.#nodes = new Map()
    this.#edges = []
  }

  addNode(node: StatementNode | Node): void {
    let n: StatementNode
    if (node instanceof Node) {
      n = new StatementNode({
        node,
        isDeclaration: /Declaration/.test(node.type),
        isTerminal: false
      })
    } else {
      n = node
    }

    if (!this.#nodes.has(n.id)) {
      // console.error('Original', this.nodes[node.id])
      // console.error('New', node)
      // throw new Error(`Duplicated node id: ${node.id}`)

      this.#nodes.set(n.id, n)
    }
  }

  addEdge(edge: Relation): void {
    const { src, dst } = edge
    if (!this.#nodes.has(src.id)) {
      throw new Error(`Missing source node: ${src.id}`)
    }

    if (!this.#nodes.has(dst.id)) {
      throw new Error(`Missing destination node: ${dst.id}`)
    }

    this.#edges.push(edge)
  }

  getNode(id: string | Node): StatementNode {
    let key: string = id as string
    if (id instanceof Node) key = hash(id)
    if (this.#nodes.has(key)) return this.#nodes.get(key)

    this.#nodes.forEach(n => console.log(n.id))
    console.log('===> Missing', key)
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

  toDot(): string {
    const nodeToLoc = (n: Node) =>
      `"${n.loc.start.line}:${n.loc.start.column},${n.loc.end.line},${n.loc.end.column}"`
    const nodes: string = this.getAllNodes()
      .map(n => nodeToLoc(n.node))
      .join(';')
    const edges: string = this.#edges
      .map(
        edge =>
          `${nodeToLoc(edge.src.node)} -> ${nodeToLoc(
            edge.dst.node
          )} [label="${edge.rels.join(',')}"]`
      )
      .join(';')
    return `digraph { ${nodes}; ${edges} }`
  }
}
