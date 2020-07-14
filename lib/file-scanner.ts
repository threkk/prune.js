import { resolve, join } from 'path'
import { readFileSync, PathLike } from 'fs'
import { ScopeManager, analyze } from 'eslint-scope'
import { traverse } from 'estraverse'
import * as estree from 'estree'

// @ts-ignore TS7016
import { Options, parse } from 'espree'

import { Graph, Relationship } from './graph'
import { GraphBuilder } from './builder'

export interface FileContent {
  path: PathLike
  content: string
}

type Import = {
  type: 'path' | 'package'
  name?: string
}

export class FileScanner {
  #path: Readonly<PathLike>
  #sm: Readonly<ScopeManager>
  #ast: Readonly<estree.Node>
  #graph: Graph
  #exports: string[]
  #imports: Import[]

  constructor(path: PathLike, jsx: boolean = false) {
    this.#path = path
    this.#graph = null

    const content: string = readFileSync(this.#path as PathLike, 'utf-8')
    const options: Options = {
      sourceType: 'module', // Enables the import/export statements.
      loc: true, // Enables locations.a
      range: true, // Add ranges to the nodes [node.start, node.end]
      ecmaVersion: 10,
      allowHashBang: true,
      locations: true,
      ecmaFeatures: {
        jsx,
        globalReturn: true
      }
    }

    this.#ast = parse(content, options)
    this.#sm = analyze(this.#ast, {
      ecmaVersion: 10, // Matching versions.
      ignoreEval: true, // Could be enabled if considered.
      sourceType: 'module' // ES6 support
    })

    this.__build()
    this.__registerExports()
    this.__registerImports()
  }

  __build() {
    const gb = new GraphBuilder(this.#ast, this.#sm)
    this.#graph = gb
      .generateVertices()
      .addReadWriteRelantionships()
      .linkCallParameters()
      .getGraph()
  }

  __registerExports() {
    for (const vertex of this.#graph.getAllVertices()) {
      traverse(vertex.node, {
        enter: (node: estree.Node) => {
          if (
            /Export/.test(node.type) ||
            (node.type === 'AssignmentExpression' && isModuleExports(node.left))
          ) {
            // It is not terminal per se, it is just exported so far..
            // vertex.isTerminal = true
            const edges = this.#graph.getEdgeByVertex(vertex)
            for (const edge of edges) {
              if (
                edge.rel === Relationship.READ ||
                edge.rel === Relationship.CALL
              ) {
                this.#exports.push(edge.var)
              }
            }
          }
        }
      })
    }
  }

  __registerImports() {
    for (const vertex of this.#graph.getAllVertices()) {
      traverse(vertex.node, {
        enter: (node: estree.Node) => {
          if (node.type === 'ImportDeclaration') {
            for (const spec of node.specifiers) {
              this.#imports.push({
                name: (spec as estree.ImportSpecifier).imported.name,
                type: isRequirePath(node.source.value as string)
                  ? 'path'
                  : 'package'
              })
            }
          }
        }
      })
    }
  }

  getExports(): string[] {
    return this.#exports
  }

  getImports(): Import[] {
    return this.#imports
  }

  printGraph() {
    console.log(this.#graph.toString())
  }
}

function isModuleExports(node: estree.Node): boolean {
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'module' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'exports'
  )
}

function isRequirePath(str: string): boolean {
  // https://nodejs.org/en/knowledge/getting-started/what-is-require/
  return str.startsWith('./') || str.startsWith('/')
}

const file = resolve(
  // join(process.cwd(), './test/validation/03-nested-scopes-invalid.js')
  // join(process.cwd(), './test/validation/04-function-call-valid.js')
  join(process.cwd(), './test/validation/05-control-flow-valid.js')
  // join(process.cwd(), './test/validation/06-exports-invalid.js')
)
const fs = new FileScanner(file)
fs.printGraph()
