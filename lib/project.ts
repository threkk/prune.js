import { statSync } from 'fs'
import { extractFiles, getDependenciesFromPackage } from './files'
import { Graph, Relationship, Relation } from './graph'
import { SourceFile, Import, Export } from './sourcefile'
import { isString } from 'util'

const DEFAULT_IGNORED = ['.git', 'node_modules']

export interface ProjectProps {
  ignore?: string[]
  root: string
}

export default class Project {
  // Project configuration
  root: Readonly<string>
  ignore: Readonly<string[]>
  paths: Readonly<string[]>

  // Files, edges and dependencies.
  dependencies: Readonly<string[]>
  files: { [key: string]: SourceFile }
  importEdges: Relation[]

  constructor(props: ProjectProps) {
    this.root = props.root
    this.ignore = [...DEFAULT_IGNORED, ...props.ignore] ?? [...DEFAULT_IGNORED]

    const root = statSync(this.root)

    if (root.isFile()) {
      this.paths = [this.root]
      this.dependencies = []
    } else if (root.isDirectory()) {
      this.paths = extractFiles(this.root, {
        ignored: [...this.ignore],
        extensions: ['js'],
      })
      this.dependencies = getDependenciesFromPackage(this.root)
    }

    this.importEdges = []
    this.files = {}
    for (const path of this.paths) {
      this.files[path] = new SourceFile(path, false)
    }

    // Linking modules
    const allImports: Import[] = []
    const allExports: { [key: string]: Export } = {}

    for (const file of Object.values(this.files)) {
      allImports.push(...file.getImports())
      for (const exp of file.getExports()) {
        allExports[exp.absolutePath] = exp
      }
    }

    const exportPaths = Object.keys(allExports)
    for (const imp of allImports) {
      if (imp.type === 'path' && exportPaths.includes(imp.path.absolutePath)) {
        this.importEdges.push({
          src: imp.vertex,
          dst: allExports[imp.path.absolutePath].vertex,
          rel: Relationship.IMPORT,
          var: isString(imp.imported) ? imp.imported : imp.imported.toString(),
        })
        this.importEdges.push({
          src: allExports[imp.path.absolutePath].vertex,
          dst: imp.vertex,
          rel: Relationship.EXPORT,
        })
      }
    }
  }

  public toString(): string {
    return this.toDot(true)
  }

  public toDot(withPaths: boolean = false): string {
    const graphVerticesToString = (graph: Graph) =>
      graph
        .getAllVertices()
        .filter((n) => n.node.loc != null && n.node.type !== 'Program')
        .map(
          (n) =>
            `"${withPaths ? graph.getPath() : ''} ${n
              .toString()
              .substring(1, n.toString().length - 1)}"` +
            (n.isTerminal ? '[shape=box]' : '[shape=oval]')
        )
        .join(';')

    const edgesToString = (edges: Relation[]) =>
      edges
        .map(
          (edge) =>
            `${edge.src} -> ${edge.dst} [label="rel=${edge.rel}${
              edge.var != null ? ',var=' + edge.var : ''
            }${edge.index != null ? ',idx=' + edge.index : ''}"]`
        )
        .join(';')

    let nodes = ''
    let edges = edgesToString(this.importEdges)
    for (const file of Object.keys(this.files)) {
      const graph = this.files[file].getGraph()
      nodes += graphVerticesToString(graph)
      edges += edgesToString(graph.getAllEdges())
    }

    return `digraph { ${nodes}; ${edges} }`
  }
}

// const file = resolve(
// join(process.cwd(), './test/validation/03-nested-scopes-invalid.js')
// join(process.cwd(), './test/validation/04-function-call-valid.js')
// join(process.cwd(), './test/validation/05-control-flow-valid.js')
// join(process.cwd(), './test/validation/06-exports-invalid.js')
// join(process.cwd(), './test/validation/07-commonjs-valid.js')
// )
// const p = resolve(
//   join(process.cwd(), '../prune.js-samples/node-express-realworld-example-app')
// )

// const proj = new Project(
//   '../prune.js-samples/node-express-realworld-example-app'
// )
// console.log(proj.generateGraphs().linkGraphs().toDot(true))
