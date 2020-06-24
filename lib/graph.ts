import * as estree from 'estree'
import hash from './util/hash'
import { StatementType, isStatementType } from './ast'

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

interface StatementVertexProps {
  node: StatementType
  isTerminal: boolean
  isDeclaration: boolean
}

export class StatementVertex {
  id: string
  start: number
  end: number
  node: StatementType
  isTerminal: boolean
  isDeclaration: boolean

  constructor(props: StatementVertexProps) {
    this.id = hash(props.node)
    this.node = props.node
    this.isTerminal = props.isTerminal
    this.isDeclaration = props.isDeclaration
    ;[this.start, this.end] = props.node.range!
  }

  toString(): string {
    return `"${this.node.loc.start.line}:${this.node.loc.start.column},${this.node.loc.end.line}:${this.node.loc.end.column}_${this.node.type}"`
  }
}

export interface RelationProps {
  src: StatementVertex | StatementType
  dst: StatementVertex | StatementType
  rel: Relationship
  var?: string
  index?: number
}

interface Relation extends RelationProps {
  src: StatementVertex
  dst: StatementVertex
}

export class Graph {
  #nodes: Map<string, StatementVertex>
  #edges: Relation[]

  constructor() {
    this.#nodes = new Map()
    this.#edges = []
  }

  addVertex(node: StatementVertex | StatementType): void {
    const n: StatementVertex =
      node instanceof StatementVertex
        ? node
        : new StatementVertex({
            node,
            isDeclaration: /Declaration/.test(node.type),
            isTerminal: false
          })

    if (!this.#nodes.has(n.id)) {
      // console.error('Original', this.nodes[node.id])
      // console.error('New', node)
      // throw new Error(`Duplicated node id: ${node.id}`)

      this.#nodes.set(n.id, n)
    }
  }

  addEdge(edge: RelationProps): void {
    const src: StatementVertex =
      edge.src instanceof StatementVertex ? edge.src : this.getVertex(edge.src)
    const dst: StatementVertex =
      edge.dst instanceof StatementVertex ? edge.dst : this.getVertex(edge.dst)

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

  // getNode(id: string | Node): StatementNode {
  //   let key: string
  //   if (id instanceof Node) key = hash(id)
  //   else key = id
  //   if (this.#nodes.has(key)) return this.#nodes.get(key)
  //   return null
  //   // throw new Error(`Node with id ${key} does not exist.`)
  // }
  getVertex(node: estree.Node): StatementVertex {
    const [start, end] = node.range!
    // console.log(`Checking for: ${node.type}${start},${end}`)
    let currVertex: StatementVertex = null
    let currDist: number = 0
    const pow2dist = (vs: number, ve: number): number =>
      Math.pow(Math.abs(vs - start), 2) + Math.pow(Math.abs(ve - end), 2)
    for (const [i, vertex] of this.#nodes) {
      // console.log(
      //   `Testing ${i} vertex: ${vertex.node.type}${vertex.start},${vertex.end}`
      // )
      if (currVertex == null) {
        currVertex = vertex
        currDist = pow2dist(vertex.start, vertex.end)
      }
      if (vertex.start <= start && vertex.end >= end) {
        // console.log(
        //   `Last vertex was ${lastVertex.start},${lastVertex.end}. Swapped.`
        // )
        const dist = pow2dist(vertex.start, vertex.end)
        if (dist < currDist) {
          currVertex = vertex
          currDist = dist
        }
      }
    }
    return currVertex
  }

  getAllVertices(): StatementVertex[] {
    return [...this.#nodes.values()]
  }

  getEdgeByVertex(node: StatementVertex): Relation[] {
    const { id } = node

    return this.#edges.filter(edge => edge.src.id === id || edge.dst.id === id)
  }

  getAllEdges(): Relation[] {
    return this.#edges
  }

  getEdgesLength(): number {
    return this.#edges.length
  }

  getVerticesSize(): number {
    return this.#nodes.size
  }

  toString(): string {
    const nodes: string = this.getAllVertices()
      .filter(n => n.node.loc != null)
      .join(';')
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
