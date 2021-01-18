import { resolve, join } from 'path'
import { readFileSync, PathLike } from 'fs'
import { ScopeManager, analyze } from 'eslint-scope'
import { traverse } from 'estraverse'
import * as estree from 'estree'

// @ts-ignore TS7016
import { Options, parse } from 'espree'

import { Graph, Relationship } from './graph'
import { GraphBuilder } from './builder'

const MODULE_DEFAULT = Symbol('__PRUNE_MODULE_DEFAULT')
const MODULE_NAMESPACE = Symbol('__PRUNE_MODULE_NAMESPACE')

export interface FileContent {
  path: PathLike
  content: string
}

type Import = {
  type: 'path' | 'package'
  local: string
  imported: string | symbol
  path: string
}

export class SourceFile {
  #path: Readonly<PathLike>
  #sm: Readonly<ScopeManager>
  #ast: Readonly<estree.Node>
  #graph: Graph
  #exports: string[]
  #imports: Import[]

  constructor(path: PathLike, jsx: boolean = false) {
    this.#path = path
    this.#graph = null
    this.#imports = []
    this.#exports = []

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
        globalReturn: true,
      },
    }

    this.#ast = parse(content, options)
    this.#sm = analyze(this.#ast, {
      ecmaVersion: 10, // Matching versions.
      ignoreEval: true, // Could be enabled if considered.
      sourceType: 'module', // ES6 support
    })

    this.build()
    this.registerExports()
    this.registerImports()
  }

  private build() {
    const gb = new GraphBuilder(this.#ast, this.#sm)
    this.#graph = gb
      .generateVertices()
      .addReadWriteRelantionships()
      .linkCallParameters()
      .getGraph()
  }

  private registerExports() {
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
        },
      })
    }
  }

  private registerImports() {
    for (const vertex of this.#graph.getAllVertices()) {
      traverse(vertex.node, {
        enter: (node: estree.Node) => {
          // import a from 'a'
          if (node.type === 'ImportDeclaration') {
            const importType = isRequirePath(node.source.value.toString())
              ? 'path'
              : 'package'
            for (const spec of node.specifiers) {
              switch (spec.type) {
                case 'ImportDefaultSpecifier':
                  this.#imports.push({
                    local: spec.local.name,
                    imported: MODULE_DEFAULT,
                    type: importType,
                    path: node.source.value.toString(),
                  })
                  break
                case 'ImportNamespaceSpecifier':
                  this.#imports.push({
                    local: spec.local.name,
                    imported: MODULE_NAMESPACE,
                    type: importType,
                    path: node.source.value.toString(),
                  })
                  break
                case 'ImportSpecifier':
                  this.#imports.push({
                    local: spec.local.name,
                    imported: spec.imported.name,
                    type: importType,
                    path: node.source.value.toString(),
                  })
                  break
                default:
              }
            }
          }

          // const x = require('x')
          if (node.type === 'VariableDeclaration') {
            for (const declarator of node.declarations) {
              const reqImport = getRequireImport(declarator.init)

              if (reqImport != null) {
                switch (declarator.id.type) {
                  case 'Identifier':
                    this.#imports.push({
                      local: declarator.id.name,
                      imported: MODULE_NAMESPACE,
                      type: reqImport.type!,
                      path: reqImport.path!,
                    })
                    break
                  // const [a, b] = require('c')
                  case 'ArrayPattern':
                    break
                  // const { a, b: c } = require('d')
                  case 'ObjectPattern':
                    break

                  // const { a = b } = require('c')
                  case 'AssignmentPattern':
                    break
                  case 'RestElement':
                  // Invalid for the case, skipping.
                }
              }
            }
          }

          // x = require('y')
          // x,y = require('z')
          if (node.type === 'AssignmentExpression') {
          }

          // require('z')
          // This is important for expressions executed in the main thread.
          if (node.type === 'CallExpression') {
          }
        },
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

function isModuleExports(node?: estree.Node): boolean {
  return (
    typeof node != null &&
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'module' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'exports'
  )
}

function isRequirePath(str: string): boolean {
  // https://nodejs.org/en/knowledge/getting-started/what-is-require/
  return str.startsWith('./') || str.startsWith('/') || str.startsWith('../')
}

function getRequireImport(node: estree.Node): Partial<Import> | null {
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal'
  ) {
    return {
      path: (node.arguments[0] as estree.Literal).raw,
      type: isRequirePath(node.arguments[0].raw) ? 'path' : 'package',
    }
  }

  return null
}

function getPatternIds(
  node: estree.Pattern
): { local: string; imported: string }[] {
  const patterns: { pattern: estree.Pattern; id?: string }[] = [
    { pattern: node },
  ]
  const ids: { local: string; imported: string }[] = []

  while (patterns.length > 0) {
    const { pattern, id } = patterns.pop()

    if (pattern.type === 'ArrayPattern') {
      if (pattern.elements != null) {
        for (const element of pattern.elements) {
          patterns.push({ pattern: element })
        }
      }
    } else if (pattern.type === 'ObjectPattern') {
      for (const prop of pattern.properties) {
        if (prop.type === 'RestElement') {
          patterns.push({ pattern: prop })
        } else {
          const key =
            prop.key.type === 'Identifier'
              ? prop.key.name
              : (prop.key as estree.Literal).raw!
          patterns.push({ pattern: prop.value, id: key })
        }
      }
    } else if (pattern.type === 'Identifier') {
      const { name } = pattern
      ids.push({
        local: id ?? name,
        imported: name,
      })
    }
  }
  return ids
}

const file = resolve(
  // join(process.cwd(), './test/validation/03-nested-scopes-invalid.js')
  // join(process.cwd(), './test/validation/04-function-call-valid.js')
  // join(process.cwd(), './test/validation/05-control-flow-valid.js')
  // join(process.cwd(), './test/validation/06-exports-invalid.js')
  join(process.cwd(), './test/validation/07-commonjs-valid.js')
)
const fs = new SourceFile(file)
fs.printGraph()
