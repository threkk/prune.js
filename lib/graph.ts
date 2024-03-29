import { Statement, Declaration, Program, Node } from 'estree'
import hash from './util/hash'
import { Scope } from 'eslint-scope'

export type StatementType = Statement | Declaration | Program
// | ExportDefaultDeclaration
// | ExportAllDeclaration
// | ExportNamedDeclaration
export function isStatementType(node: Node): node is StatementType {
  return /Statement|Declaration/.test(node.type) || node.type === 'Program'
}

interface StatementVertexProps {
  node: StatementType
  isTerminal: boolean
  isBuiltin: boolean
  isDeclaration: boolean
  scope: Scope
  graph: Graph
  parent?: StatementVertex
  path: string
}

export class StatementVertex {
  id: string
  start: number
  end: number
  node: StatementType
  scope: Scope
  isTerminal: boolean
  isDeclaration: boolean
  isBuiltin: boolean
  path: string
  block: StatementVertex[]
  parent: StatementVertex
  graph: Graph

  constructor(props: StatementVertexProps) {
    this.id = hash(props.node, props.path)
    this.node = props.node
    this.isTerminal = props.isTerminal
    this.isDeclaration = props.isDeclaration
    this.isBuiltin = props.isBuiltin
    this.scope = props.scope
    this.path = props.path
    this.graph = props.graph
    this.block = []
    this.parent = props.parent
    ;[this.start, this.end] = props.node.range!
  }

  toString(): string {
    return `"${this.path}_${this.node.loc.start.line}:${this.node.loc.start.column},${this.node.loc.end.line}:${this.node.loc.end.column}_${this.node.type}"`
  }
}

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
  DECL = 'DECL', // Source is the declaration of destination.
  IMPORT = 'IMP', // Source is importing the destination.
  EXPORT = 'EXP', // Source is exporting the destination.
}

export interface Relation {
  src: StatementVertex
  dst: StatementVertex
  rel: Relationship
  var?: string
  index?: number
}

export interface RelationProps {
  src: StatementType
  dst: StatementType
  rel: Relationship
  var?: string
  index?: number
}

export class Graph {
  vertices: { [key: string]: StatementVertex }
  edges: Relation[]
  path: Readonly<string>

  constructor(path: string) {
    this.vertices = {}
    this.edges = []
    this.path = path
  }

  addVertex(
    props: Partial<StatementVertexProps> & { node: StatementType; scope: Scope }
  ): StatementVertex {
    const defaultProps = {
      isDeclaration: /Declaration/.test(props.node.type),
      isTerminal: false,
      isBuiltin: false,
      path: this.path,
      graph: this,
    }

    const vertex: StatementVertex = new StatementVertex({
      ...defaultProps,
      ...props,
    })

    if (!this.vertices[vertex.id]) {
      this.vertices[vertex.id] = vertex
    }

    return vertex
  }

  addEdge(edge: RelationProps): void {
    const src = this.getVertexByNode(edge.src)
    const dst = this.getVertexByNode(edge.dst)

    if (!src || !this.vertices[src.id]) {
      throw new Error(`Missing source node: ${src.id}`)
    }

    if (!dst || !this.vertices[dst.id]) {
      throw new Error(`Missing destination node: ${dst.id}`)
    }

    this.edges.push({
      src,
      dst,
      rel: edge.rel,
      index: edge.index,
      var: edge.var,
    })
  }

  getVertexById(id: string): StatementVertex {
    return this.vertices[id] ?? null
  }

  getVertexByNode(node: Node): StatementVertex {
    const [start, end] = node.range!
    let currVertex: StatementVertex = null
    let currDist: number = 0
    const pow2dist = (vs: number, ve: number): number =>
      Math.pow(Math.abs(vs - start), 2) + Math.pow(Math.abs(ve - end), 2)
    for (const vertex of Object.values(this.vertices)) {
      if (currVertex == null) {
        currVertex = vertex
        currDist = pow2dist(vertex.start, vertex.end)
      }
      if (vertex.start <= start && vertex.end >= end) {
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
    return [...Object.values(this.vertices)]
  }

  getEdgesByVertex(node: StatementVertex): Relation[] {
    return this.edges.filter(
      (edge) => edge.src.id === node.id || edge.dst.id === node.id
    )
  }

  getSourceEdgesByVertex(node: StatementVertex): Relation[] {
    return this.edges.filter((edge) => edge.src.id === node.id)
  }

  getAllEdges(): Relation[] {
    return this.edges
  }

  toString(): string {
    const nodes: string = this.getAllVertices()
      .filter((n) => n.node.loc != null && n.node.type !== 'Program')
      .map((n) => `${n}` + (n.isTerminal ? '[shape=box]' : '[shape=oval]'))
      .join(';')
    const edges: string = this.getAllEdges()
      .map(
        (edge) =>
          `${edge.src} -> ${edge.dst} [label="rel=${edge.rel}${
            edge.var != null ? ',var=' + edge.var : ''
          }${edge.index != null ? ',idx=' + edge.index : ''}"]`
      )
      .join(';')
    return `digraph { ${nodes}; ${edges} }`
  }
}
