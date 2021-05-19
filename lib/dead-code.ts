import Project from './project'
import { SourceFile, isPackageImport } from './sourcefile'
import { Graph, Relation } from './graph'
import { resolve, isAbsolute } from 'path'

class SubGraph {
  constructor(
    public files: { [key: string]: SourceFile } = {},
    public importEdges: Relation[] = [],
    public dependencies: Set<string> = new Set()
  ) {}
}

export default class DeadCode {
  #project: Project
  #subgraphs: SubGraph[]

  constructor(project: Project) {
    this.#project = project
    this.#subgraphs = []
  }

  createSubgraph(entryPoint: string) {
    const entry = isAbsolute(entryPoint) ? entryPoint : resolve(entryPoint)
    if (Object.keys(this.#project.files).includes(entry)) {
      const sg = new SubGraph()

      const stack = [this.#project.files[entry]]
      while (stack.length > 0) {
        const file = stack.pop()

        // Already processed.
        if (sg.files.hasOwnProperty(file.getHash())) continue

        // Add the file to the subgraph
        sg.files[file.getHash()] = file

        // And its packages to the list of dependencies.
        file
          .getImports()
          .filter(isPackageImport)
          .forEach((p) => sg.dependencies.add(p.name))

        const belongsToFile = belongsTo(file.getGraph())
        // TODO: THIS FAILS A LOT.
        // There is a problem with the paths.
        // Projects to test:
        // - node-realworld-example-app
        // - dead-code
        // - babylon-sample
        const connectedFiles = this.#project.importEdges
          .filter(belongsToFile)
          .map((e) => this.#project.files[e.dst.path])
        console.log(connectedFiles)
        break
        stack.push(...connectedFiles)
      }

      this.#subgraphs.push(sg)
    }
  }

  getDeadDependencies(): string[] {
    const allDeps = this.#project.dependencies

    const usedDeps: string[] = this.#subgraphs.reduce(
      (prev: string[], curr: SubGraph) => prev.concat([...curr.dependencies]),
      []
    )

    return allDeps.filter((dep) => !usedDeps.includes(dep))
  }

  getDeadModules(): SourceFile[] {
    const allHashes = this.#subgraphs
      .reduce(
        (prev: SourceFile[], curr: SubGraph) =>
          prev.concat(Object.values(curr.files)),
        []
      )
      .map((sf) => sf.getHash())

    const dead = []
    for (const file of Object.values(this.#project.files)) {
      if (!allHashes.includes(file.getHash())) {
        dead.push(file)
      }
    }
    return dead
  }

  getDeadStatements() {}
}

const belongsTo = (g: Graph) => (e: Relation) => e.src.path === g.getPath()
