import Project from './project'
import { SourceFile, isPackageImport } from './sourcefile'
import { Graph, Relation, Relationship, StatementVertex } from './graph'
import { resolve, isAbsolute } from 'path'

const FUNC_SCOPE = /Function|With|Module|Class/

class SubGraph {
  constructor(
    public files: { [key: string]: SourceFile } = {},
    public vertices: { [key: string]: StatementVertex } = {},
    public edges: Relation[] = [],
    public dependencies: string[] = [],
    public containsTerminal: boolean = false
  ) {}
}

// TODO: Subgraph algorithm.
// Get all the vertices of a file.
// Get the first vertex, and add it to the subgraph. Add every other vertex that
// is linked. If it is in a different file, add remaning vertices to the list of
// vertices.
// If there are no more linkable vertices to add to the subgraph, create a new
// subgraph with the first vertex of the list.
export default class DeadCode {
  #project: Project
  #subgraphs: SubGraph[]

  constructor(project: Project) {
    this.#project = project
    this.#subgraphs = []
  }

  createSubgraph(entryPoint: string) {
    const entry = isAbsolute(entryPoint) ? entryPoint : resolve(entryPoint)

    // If the entry point is actually not in the project, we are done.
    if (!Object.keys(this.#project.files).includes(entry)) {
      console.log(`Entry point not found: ${entry}`)
      return
    }

    // Creating a new subgraph
    const sg = new SubGraph()

    // Getting all the vertices of the entry point.
    const stack: StatementVertex[] = [
      ...this.#project.files[entry].graph.getAllVertices(),
    ]

    // We will keep adding vertices to the stack until we are done.
    while (stack.length > 0) {
      const vertex = stack.pop()

      // If it is already processed, we skip the vertex.
      if (Object.keys(sg.vertices).includes(vertex.id)) continue
      // if not, we add it to the subgraph.
      else sg.vertices[vertex.id] = vertex

      // TODO: Maybe, if it has a block, push the vertex to analyse too. That
      // will solve the issue of parameter-less functions.
      // stack.push(...vertex.block)

      // If we have not tracked the file yet, we do
      if (!Object.keys(sg.files).includes(vertex.graph.path)) {
        const file = this.#project.files[vertex.graph.path]
        sg.files[vertex.graph.path] = file
        // No, this will not work.
        // stack.push(...file.graph.getAllVertices())
      }

      const file = sg.files[vertex.graph.path]

      // If it is terminal, we flip the flag.
      if (vertex.isTerminal) sg.containsTerminal = true

      // Now that the vertex is processed, we start looking into the connecting
      // edges to get more vertices. We have 3 types of edges: inter vertex
      // edges, inter graph edges and import edges. We also need to add the
      // block items if the vertex has.
      // Block
      if (vertex.block.length > 0) {
        for (const v of vertex.block) {
          if (!FUNC_SCOPE.test(v.node.type)) {
            stack.push(v)
          }
        }
      }

      // Inter vertex
      vertex.graph.getEdgesByVertex(vertex).forEach((e) => {
        // Add the edge to the subgraph
        sg.edges.push(e)
        // Add the connected vertex to the stack.
        stack.push(e.src.id === vertex.id ? e.dst : e.src)
      })

      // Inter module edges
      for (const impEdge of this.#project.importEdges) {
        if (
          impEdge.rel === Relationship.IMPORT &&
          impEdge.src.id === vertex.id
        ) {
          sg.edges.push(impEdge)
          stack.push(impEdge.dst)
        }
      }

      // Module import
      const imports = file.getImports()[vertex.id] ?? []
      for (const i of imports) {
        if (i.type === 'package') {
          sg.dependencies.push(i.name)
        }
      }

      // And its packages to the list of dependencies.
      // file
      //   .getImports()
      //   .filter(isPackageImport)
      //   .forEach((p) => {
      //     if (!sg.dependencies.includes(p.name)) {
      //       sg.dependencies.push(p.name)
      //     }
      //   })

      // const belongsToFile = belongsTo(file.getGraph())
      // // TODO: THIS FAILS A LOT.
      // // There is a problem with the paths.
      // // Projects to test:
      // // - node-realworld-example-app
      // // - dead-code
      // // - babylon-sample
      // const connectedFiles = this.#project.importEdges
      //   .filter(belongsToFile)
      //   .map((e) => this.#project.files[e.dst.path])
      // console.log(connectedFiles)
      // break
      // stack.push(...connectedFiles)
    }

    this.#subgraphs.push(sg)
  }

  getDeadDependencies(): string[] {
    const allDeps = this.#project.dependencies

    const usedDeps = []
    for (const sg of this.#subgraphs) {
      if (sg.containsTerminal) usedDeps.push(...sg.dependencies)
    }

    return allDeps.filter((dep) => !usedDeps.includes(dep))
  }

  getDeadModules(): SourceFile[] {
    const usedFiles = []
    for (const sg of this.#subgraphs) {
      if (sg.containsTerminal) usedFiles.push(...Object.keys(sg.files))
    }

    const dead: SourceFile[] = []
    for (const path of Object.keys(this.#project.files)) {
      if (!usedFiles.includes(path)) dead.push(this.#project.files[path])
    }

    return dead
    // const allHashes = this.#subgraphs
    //   .reduce(
    //     (prev: SourceFile[], curr: SubGraph) =>
    //       prev.concat(Object.values(curr.files)),
    //     []
    //   )
    //   .map((sf) => sf.getHash())

    // const dead = []
    // for (const file of Object.values(this.#project.files)) {
    //   if (!allHashes.includes(file.getHash())) {
    //     dead.push(file)
    //   }
    // }
    // return dead
  }

  getDeadStatements(): StatementVertex[] {
    const usedFiles = []
    for (const sg of this.#subgraphs) {
      if (sg.containsTerminal) usedFiles.push(...Object.keys(sg.files))
    }

    const usedVertexIds: string[] = []
    for (const sg of this.#subgraphs) {
      if (sg.containsTerminal) usedVertexIds.push(...Object.keys(sg.vertices))
    }

    const dead: StatementVertex[] = []
    for (const file of Object.values(this.#project.files)) {
      if (usedFiles.includes(file.path)) {
        for (const vertex of file.graph.getAllVertices()) {
          if (
            !usedVertexIds.includes(vertex.id) &&
            vertex.node.type !== 'Program' &&
            !vertex.isTerminal
          ) {
            dead.push(vertex)
          }
        }
      }
    }

    return dead
  }
}

// const belongsTo = (g: Graph) => (e: Relation) => e.src.path === g.path
