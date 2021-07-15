import { statSync } from 'fs'
import { extractFiles, getDependenciesFromPackage } from './files'
import { Graph, Relationship, Relation } from './graph'
import { SourceFile, Import, Export } from './sourcefile'
import { isString } from 'util'

const DEFAULT_IGNORED = ['.git', 'node_modules']

export interface ProjectProps {
  ignore?: string[]
  isLibrary?: boolean
  root: string
}

export default class Project {
  // Project configuration
  root: Readonly<string>
  ignore: Readonly<string[]>
  paths: Readonly<string[]>
  isLibrary: Readonly<boolean>

  // Files, edges and dependencies.
  dependencies: Readonly<string[]>
  files: { [key: string]: SourceFile }
  importEdges: Relation[]

  constructor(props: ProjectProps) {
    this.root = props.root
    this.isLibrary = props.isLibrary ?? false
    this.ignore = [...DEFAULT_IGNORED, ...(props.ignore ?? [])] ?? [
      ...DEFAULT_IGNORED,
    ]

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
      this.files[path] = new SourceFile(path, this.isLibrary, false)
    }

    // Linking modules
    const allImports: Import[] = []
    const allExports: { [key: string]: Export } = {}

    for (const file of Object.values(this.files)) {
      const imports = Object.values(file.getImports()).reduce(
        (prev, curr) => [...prev, ...curr],
        []
      )
      allImports.push(...imports)

      const exports = Object.values(file.getExports()).reduce(
        (prev, curr) => [...prev, ...curr],
        []
      )
      for (const exp of exports) {
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
      }
    }
  }

  public toString(): string {
    return this.toDot(true)
  }

  public toDot(withPaths: boolean = false): string {
    const vertices = []
    const links = [...this.importEdges]
    for (const file of Object.values(this.files)) {
      vertices.push(...file.graph.getAllVertices())
      links.push(...file.graph.getAllEdges())
    }

    const nodes: string = vertices
      .filter((n) => n.node.loc != null && n.node.type !== 'Program')
      .map((n) => `${n}` + (n.isTerminal ? '[shape=box]' : '[shape=oval]'))
      .join(';')
    const edges: string = links
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
