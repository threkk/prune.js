import { resolve, join, extname, parse as parsePath } from 'path'
import { readFileSync, PathLike, accessSync, constants } from 'fs'
import { ScopeManager, analyze } from 'eslint-scope'
import { traverse } from 'estraverse'
import { Declaration, Literal, Pattern, Node } from 'estree'

// @ts-ignore TS7016
import { Options, parse } from 'espree'

import { Graph, Relationship, StatementVertex } from './graph'
import { buildGraph } from './builder'
import hash from './util/hash'

const MODULE_DEFAULT = Symbol('__PRUNE_MODULE_DEFAULT')
const MODULE_NAMESPACE = Symbol('__PRUNE_MODULE_NAMESPACE')

export interface FileContent {
  path: PathLike
  content: string
}

type BaseImport = {
  imported: string | symbol
  local: string
  vertex: StatementVertex
}

type PackageImport = BaseImport & {
  type: 'package'
  name: string
}

type ModuleImport = BaseImport & {
  type: 'path'
  path: {
    relativePath: string
    absolutePath: string
  }
}

export type Import = PackageImport | ModuleImport

export type Export = {
  var: string | symbol
  vertex: StatementVertex
  absolutePath: string
}

export class SourceFile {
  #sm: Readonly<ScopeManager>
  #ast: Readonly<Node>
  #exports: { [key: string]: Export[] }
  #imports: { [key: string]: Import[] }
  path: Readonly<string>
  graph: Readonly<Graph>

  constructor(path: string, isLibrary: boolean = false, jsx: boolean = false) {
    this.path = path
    this.graph = null
    this.#imports = {}
    this.#exports = {}

    const content: string = readFileSync(this.path, 'utf-8')
    // TODO: Issues parsing the shebang (#!/usr/...)
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

    this.graph = buildGraph(this.path, this.#ast, this.#sm)

    this.registerExports(isLibrary)
    this.registerImports()
  }

  public getExports(): { [key: string]: Export[] } {
    return this.#exports
  }

  public getImports(): { [key: string]: Import[] } {
    return this.#imports
  }

  private registerExports(isLibrary: boolean) {
    for (const vertex of this.graph.getAllVertices()) {
      traverse(vertex.node, {
        enter: (node: Node) => {
          if (
            /Export/.test(node.type) ||
            (node.type === 'AssignmentExpression' && isModuleExports(node.left))
          ) {
            const absolutePath = this.path

            // module.exports = something
            // exports.something = something
            // exports = something
            if (node.type === 'AssignmentExpression') {
              const edges = this.graph.getEdgesByVertex(vertex)
              if (!this.#exports[vertex.id]) this.#exports[vertex.id] = []

              if (edges.length > 0) {
                for (const edge of edges) {
                  let variable = null
                  if (
                    edge.rel === Relationship.READ ||
                    edge.rel === Relationship.CALL
                  ) {
                    variable = edge.var
                  }
                  // We need to remove the extension to match the imports
                  // behaviour.
                  if (isLibrary)
                    this.graph.vertices[vertex.id].isTerminal = true
                  this.#exports[vertex.id].push({
                    var: variable,
                    vertex,
                    absolutePath,
                  })
                }
              } else {
                if (isLibrary) this.graph.vertices[vertex.id].isTerminal = true
                this.#exports[vertex.id].push({
                  var: null,
                  vertex,
                  absolutePath,
                })
              }
            } else {
              if (!this.#exports[vertex.id]) this.#exports[vertex.id] = []
              switch (node.type) {
                // export * from 'mod'
                case 'ExportAllDeclaration':
                  this.#exports[vertex.id].push({
                    var: MODULE_NAMESPACE,
                    vertex,
                    absolutePath,
                  })

                  const source = node.source.value.toString()
                  if (!this.#imports[vertex.id]) this.#imports[vertex.id] = []
                  if (isRequirePath(source)) {
                    this.#imports[vertex.id].push({
                      vertex,
                      type: 'path',
                      imported: MODULE_NAMESPACE,
                      local: null,
                      path: {
                        relativePath: source,
                        absolutePath: this.getAbsoluteImportPath(source),
                      },
                    })
                  } else {
                    this.#imports[vertex.id].push({
                      vertex,
                      type: 'package',
                      imported: MODULE_NAMESPACE,
                      local: null,
                      name: source,
                    })
                  }

                  if (isLibrary)
                    this.graph.vertices[vertex.id].isTerminal = true
                  break
                // export default functon() {}
                case 'ExportDefaultDeclaration':
                  let declaration: string = null
                  switch (node.declaration.type) {
                    case 'FunctionDeclaration':
                      declaration = node.declaration.id.name
                      break
                    case 'ClassDeclaration':
                      declaration = node.declaration.id.name
                      break
                    default:
                      declaration = null
                  }
                  this.#exports[vertex.id].push({
                    vertex,
                    var: declaration,
                    absolutePath: absolutePath,
                  })

                  // We also need to link the export statement with the function
                  // declared.
                  if (/Declaration/.test(node.declaration.type)) {
                    this.graph.addEdge({
                      src: node as unknown as Declaration, // Type wizardry
                      dst: node.declaration as Declaration,
                      var: declaration ?? null,
                      rel: Relationship.EXPORT,
                    })
                  }

                  if (isLibrary)
                    this.graph.vertices[vertex.id].isTerminal = true
                  break
                case 'ExportNamedDeclaration':
                  // export var foo = 1
                  if (node.declaration) {
                    const declarations = []
                    if (node.declaration.type === 'VariableDeclaration') {
                      for (const declaration of node.declaration.declarations) {
                        const ids = getPatternIds(declaration.id)
                        declarations.push(...ids)
                      }
                    } else {
                      declarations.push(node.declaration.id.name)
                    }

                    for (const declaration of declarations) {
                      this.#exports[vertex.id].push({
                        vertex,
                        var: declaration,
                        absolutePath,
                      })
                    }

                    // export { foo, bar }
                    // export {foo, bar } from 'mod'
                  } else {
                    for (const spec of node.specifiers) {
                      this.#exports[vertex.id].push({
                        vertex,
                        var: spec.exported.name,
                        absolutePath,
                      })

                      if (node.source) {
                        const source = node.source.value.toString()
                        if (!this.#imports[vertex.id])
                          this.#imports[vertex.id] = []
                        if (isRequirePath(source)) {
                          this.#imports[vertex.id].push({
                            vertex,
                            type: 'path',
                            imported: spec.exported.name,
                            local: null,
                            path: {
                              relativePath: source,
                              absolutePath: this.getAbsoluteImportPath(source),
                            },
                          })
                        } else {
                          this.#imports[vertex.id].push({
                            vertex,
                            type: 'package',
                            imported: spec.exported.name,
                            local: null,
                            name: source,
                          })
                        }
                      }
                    }
                  }
                  if (isLibrary)
                    this.graph.vertices[vertex.id].isTerminal = true
                  break
              }
            }
          }
        },
      })
    }
  }

  private registerImports() {
    for (const vertex of this.graph.getAllVertices()) {
      if (vertex.node.type === 'Program') continue
      traverse(vertex.node, {
        enter: (node: Node) => {
          // import a from 'a'
          if (node.type === 'ImportDeclaration') {
            const makeImport = (
              local: string,
              imported: string | symbol
            ): Import => {
              const isPath = isRequirePath(node.source.value.toString())
              const base = {
                vertex,
                local,
              }
              if (isPath) {
                return {
                  ...base,
                  type: 'path',
                  imported: MODULE_DEFAULT,
                  path: {
                    relativePath: this.getRelativeImportPath(
                      node.source.value.toString()
                    ),
                    absolutePath: this.getAbsoluteImportPath(
                      node.source.value.toString()
                    ),
                  },
                }
              } else {
                // It can be 'module' or 'module/submodule/'
                const name = node.source.value.toString().split('/')[0]
                return {
                  ...base,
                  imported: MODULE_DEFAULT,
                  type: 'package',
                  name,
                }
              }
            }

            if (!this.#imports[vertex.id]) this.#imports[vertex.id] = []
            for (const spec of node.specifiers) {
              switch (spec.type) {
                case 'ImportDefaultSpecifier':
                  this.#imports[vertex.id].push(
                    makeImport(spec.local.name, MODULE_DEFAULT)
                  )
                  break
                case 'ImportNamespaceSpecifier':
                  this.#imports[vertex.id].push(
                    makeImport(spec.local.name, MODULE_NAMESPACE)
                  )
                  break
                case 'ImportSpecifier':
                  this.#imports[vertex.id].push(
                    makeImport(spec.local.name, spec.imported.name)
                  )
                  break
              }
            }
            // It is require type
          } else {
            // const x = require('x')
            if (node.type === 'VariableDeclaration') {
              for (const declarator of node.declarations) {
                const reqImport = getRequireString(declarator.init)
                if (reqImport != null) {
                  // Extra checks, but we are sure that the id is a valid one
                  // and that at least one node will be pushed.
                  if (!this.#imports[vertex.id]) this.#imports[vertex.id] = []
                  const isPath = isRequirePath(reqImport)
                  if (declarator.id.type === 'Identifier') {
                    const base = {
                      vertex,
                      local: declarator.id.name,
                      imported: MODULE_NAMESPACE,
                    }
                    if (isPath) {
                      this.#imports[vertex.id].push({
                        ...base,
                        type: 'path',
                        path: {
                          relativePath: this.getRelativeImportPath(reqImport),
                          absolutePath: this.getAbsoluteImportPath(reqImport),
                        },
                      })
                    } else {
                      this.#imports[vertex.id].push({
                        ...base,
                        type: 'package',
                        name: reqImport,
                      })
                    }
                  } else {
                    const ids = getPatternIds(declarator.id)
                    for (const id of ids) {
                      const { local, imported } = id
                      const base = {
                        vertex,
                        local,
                        imported,
                      }
                      if (isPath) {
                        this.#imports[vertex.id].push({
                          ...base,
                          type: 'path',
                          path: {
                            relativePath: this.getRelativeImportPath(reqImport),
                            absolutePath: this.getAbsoluteImportPath(reqImport),
                          },
                        })
                      } else {
                        this.#imports[vertex.id].push({
                          ...base,
                          type: 'package',
                          name: reqImport,
                        })
                      }
                    }
                  }
                }
              }
            }

            // x = require('y')
            // x,y = require('z')
            if (node.type === 'AssignmentExpression') {
              const requireImport = getRequireString(node.right)
              if (requireImport != null) {
                if (!this.#imports[vertex.id]) this.#imports[vertex.id] = []
                const isPath = isRequirePath(requireImport)
                const ids =
                  node.left.type === 'Identifier'
                    ? [{ local: node.left.name, imported: MODULE_NAMESPACE }]
                    : getPatternIds(node.left)
                for (const id of ids) {
                  const base = {
                    vertex,
                    local: id.local,
                    imported: MODULE_NAMESPACE,
                  }
                  if (isPath) {
                    this.#imports[vertex.id].push({
                      ...base,
                      type: 'path',
                      path: {
                        relativePath: this.getRelativeImportPath(requireImport),
                        absolutePath: this.getAbsoluteImportPath(requireImport),
                      },
                    })
                  } else {
                    this.#imports[vertex.id].push({
                      ...base,
                      type: 'package',
                      name: requireImport,
                    })
                  }
                }
              }
            }

            // require('z')
            // This is important for expressions executed in the main thread.
            if (node.type === 'CallExpression') {
              const requireImport = getRequireString(node)
              if (requireImport != null) {
                if (!this.#imports[vertex.id]) this.#imports[vertex.id] = []
                const isPath = isRequirePath(requireImport)
                const base = {
                  vertex,
                  local: null,
                  imported: MODULE_NAMESPACE,
                }
                if (isPath) {
                  this.#imports[vertex.id].push({
                    ...base,
                    type: 'path',
                    path: {
                      relativePath: this.getRelativeImportPath(requireImport),
                      absolutePath: this.getAbsoluteImportPath(requireImport),
                    },
                  })
                } else {
                  this.#imports[vertex.id].push({
                    ...base,
                    type: 'package',
                    name: requireImport,
                  })
                }
              }
            }
          }
        },
      })
    }
  }

  private getRelativeImportPath(str: string): string {
    return str
  }

  private getAbsoluteImportPath(str: string): string {
    const req = str //.substring(1, str.length - 1)
    if (isRequirePath(str)) {
      const parts = parsePath(this.path)
      const resolvedPath = resolve(join(parts.dir, req))

      // 1 - Base case.
      if (extname(resolvedPath) === '.js') {
        return resolvedPath
      }

      // 2 - It is missing .js
      try {
        const maybeExt = `${resolvedPath}.js`

        accessSync(maybeExt, constants.F_OK)
        return maybeExt
      } catch {
        // 3 - It is a directory
        const maybeIndex = join(resolvedPath, './index.js')
        try {
          accessSync(maybeIndex, constants.F_OK)
          return maybeIndex
        } catch {
          // Everything failed, we just return the base
          return resolvedPath
        }
      }
    }
    return req
  }
}

function isModuleExports(node?: Node): boolean {
  // module.exports = ...
  const isModuleExports =
    node != null &&
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'module' &&
    node.property.type === 'Identifier' &&
    node.property.name === 'exports'

  // exports = ...
  const isExports =
    node != null && node.type === 'Identifier' && node.name === 'exports'

  // exports.obj = ...
  const isExportObj =
    node != null &&
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'exports'

  return isModuleExports || isExports || isExportObj
}

function isRequirePath(str: string): boolean {
  const cleanStr = str // .substring(1, str.length - 1)
  // https://nodejs.org/en/knowledge/getting-started/what-is-require/
  return (
    cleanStr.startsWith('./') ||
    cleanStr.startsWith('/') ||
    cleanStr.startsWith('../')
  )
}

function getRequireString(node: Node): string | null {
  if (
    node != null &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal'
  ) {
    const arg: Literal = node.arguments[0]
    return arg.value.toString()
  }

  return null
}

function getPatternIds(node: Pattern): { local: string; imported: string }[] {
  const patterns: { pattern: Pattern; id?: string }[] = [{ pattern: node }]
  const ids: { local: string; imported: string }[] = []

  while (patterns.length > 0) {
    const { pattern, id } = patterns.pop()

    switch (pattern.type) {
      // const [a, b] = require('c')
      case 'ArrayPattern':
        if (pattern.elements != null) {
          for (const element of pattern.elements) {
            patterns.push({ pattern: element })
          }
        }
        break
      // const { a, b: c } = require('d')
      case 'ObjectPattern':
        for (const prop of pattern.properties) {
          if (prop.type === 'RestElement') {
            patterns.push({ pattern: prop })
          } else {
            const key =
              prop.key.type === 'Identifier'
                ? prop.key.name
                : (prop.key as Literal).raw!
            patterns.push({ pattern: prop.value, id: key })
          }
        }
        break
      // const a = requier('b')
      case 'Identifier':
        const { name } = pattern
        ids.push({
          local: id ?? name,
          imported: name,
        })
        break

      // Invalid cases
      // const { a = b } = require('c')
      case 'AssignmentPattern':
      // const { ...a } = require('a')
      case 'RestElement':
      default:
        break
    }
    return ids
  }
}

export const isPackageImport = (i: Import): i is PackageImport =>
  i.type === 'package'
