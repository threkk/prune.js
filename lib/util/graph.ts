export interface GNode {
  id: string
}

export interface GEdge {
  src: GNode
  dst: GNode
  value?: any
}

export class Graph {
  private nodes: { [key: string]: GNode }
  private edges: GEdge[]

  constructor() {
    this.nodes = {}
    this.edges = []
  }

  addNode(node: GNode): void {
    if (Object.keys(this.nodes).includes(node.id)) {
      throw new Error(`Duplicated node id: ${node.id}`)
    }

    this.nodes[node.id] = node
  }

  addEdge(edge: GEdge): void {
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

  getNode(id: string): GNode {
    if (this.nodes[id]) {
      return this.nodes[id]
    }
    throw new Error(`Node with id ${id} does not exist.`)
  }

  getAllNodes(): GNode[] {
    return Object.values(this.nodes)
  }

  getEdgeByNode(node: GNode): GEdge[] {
    const { id } = node

    return this.edges.filter(edge => edge.src.id === id || edge.dst.id === id)
  }

  getAllEdges(): GEdge[] {
    return this.edges
  }
}
