import { PathLike, lstatSync } from 'fs'
import { extractFiles, getPackageJson } from './files'
import { resolve, join, extname } from 'path'
import { GraphBuilder } from './builder'
import { Graph, Relationship, Relation } from './graph'
import { SourceFile, Import, Export } from './sourcefile'
import { isString } from 'util'

export default class Project {
  private root: string
  private paths: PathLike[]
  private files: SourceFile[]
  private edges: Relation[]
  private ignore: string[]
  private dependencies: string[]
  private entryPoints: string[]

  constructor(root: string, ignore?: string[]) {
    this.root = root
    this.ignore = ignore ?? []
    this.edges = []
    this.paths = []
    this.dependencies = []
    this.entryPoints = []

    // This method works with both single files and folders
    const stats = lstatSync(this.root)

    // If it is single file, this is the only entry point.
    if (stats.isFile() && extname(this.root) === '.js') {
      this.entryPoints.push(this.root)
      this.paths.push(this.root)
    }

    // If it is a directory, we have some more options.
    if (stats.isDirectory()) {
      // Search for a package.json and populate dependencies and entry points
      // with the contents of bin and main.
      const pkg = getPackageJson(this.root)
      if (pkg?.dependencies != null)
        this.dependencies.push(...Object.keys(pkg.dependencies))

      if (pkg?.bin != null)
        this.entryPoints.push(
          ...Object.values(pkg.bin as { [key: string]: string }).map((entry) =>
            resolve(join(this.root, entry))
          )
        )

      if (pkg?.main != null)
        this.entryPoints.push(resolve(join(this.root, pkg.main)))

      // Retrieve all files
      const files = extractFiles(this.root, this.ignore, ['js'])
      this.paths.push(...files.map((f) => f as string))
    }
  }

  public generateGraphs(): Project {
    this.files = this.paths.map((p) => new SourceFile(p, true))
    return this
  }

  public linkGraphs(): Project {
    const allImports: Import[] = []
    const allExports: { [key: string]: Export } = {}

    for (const file of this.files) {
      allImports.push(...file.getImports())
      for (const exp of file.getExports()) {
        allExports[exp.absolutePath] = exp
      }
    }

    const exportPaths = Object.keys(allExports)
    for (const imp of allImports) {
      if (imp.type === 'path' && exportPaths.includes(imp.absolutePath)) {
        this.edges.push({
          src: imp.vertex,
          dst: allExports[imp.absolutePath].vertex,
          rel: Relationship.IMPORT,
          var: isString(imp.imported)
            ? imp.imported
            : (imp.imported as Symbol).toString(),
        })
        this.edges.push({
          src: allExports[imp.absolutePath].vertex,
          dst: imp.vertex,
          rel: Relationship.EXPORT,
        })
      }
    }

    return this
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
    let edges = edgesToString(this.edges)
    for (const file of this.files) {
      const graph = file.getGraph()
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
const p = resolve(
  join(process.cwd(), '../prune.js-samples/node-express-realworld-example-app')
)

const proj = new Project(
  '../prune.js-samples/node-express-realworld-example-app'
)
console.log(proj.generateGraphs().linkGraphs().toDot(true))
