import { resolve, join, extname, parse as parsePath } from 'path'
import { readFileSync, PathLike } from 'fs'
import { ScopeManager, analyze } from 'eslint-scope'
import { traverse } from 'estraverse'
import { Literal, Pattern, Node } from 'estree'

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

  constructor(path: string, jsx: boolean = false) {
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

    this.registerExports()
    this.registerImports()
  }

  private registerExports() {
    const getAbsoluteImportPath = getAbsoluteImportPathBuilder(this.path)
    for (const vertex of this.graph.getAllVertices()) {
      traverse(vertex.node, {
        enter: (node: Node) => {
          if (
            /Export/.test(node.type) ||
            (node.type === 'AssignmentExpression' && isModuleExports(node.left))
          ) {
            const pathObj = parsePath(this.path)
            const absolutePath = join(pathObj.dir, pathObj.name)
            // module.export = something
            if (node.type === 'AssignmentExpression') {
              const edges = this.graph.getEdgesByVertex(vertex)
              for (const edge of edges) {
                if (
                  edge.rel === Relationship.READ ||
                  edge.rel === Relationship.CALL
                ) {
                  // We need to remove the extension to match the imports
                  // behaviour.
                  if (!this.#exports[vertex.id]) this.#exports[vertex.id] = []
                  this.#exports[vertex.id].push({
                    var: edge.var,
                    vertex,
                    absolutePath,
                  })
                }
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
                        absolutePath: getAbsoluteImportPath(source),
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
                              absolutePath: getAbsoluteImportPath(source),
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
          const getAbsoluteImportPath = getAbsoluteImportPathBuilder(this.path)
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
                    relativePath: getRelativeImportPath(
                      node.source.value.toString()
                    ),
                    absolutePath: getAbsoluteImportPath(
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
                          relativePath: getRelativeImportPath(reqImport),
                          absolutePath: getAbsoluteImportPath(reqImport),
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
                            relativePath: getRelativeImportPath(reqImport),
                            absolutePath: getAbsoluteImportPath(reqImport),
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
                        relativePath: getRelativeImportPath(requireImport),
                        absolutePath: getAbsoluteImportPath(requireImport),
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
                      relativePath: getRelativeImportPath(requireImport),
                      absolutePath: getAbsoluteImportPath(requireImport),
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

  getExports(): { [key: string]: Export[] } {
    return this.#exports
  }

  getImports(): { [key: string]: Import[] } {
    return this.#imports
  }
}

function isModuleExports(node?: Node): boolean {
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

const getRelativeImportPath = (str: string): string => str
// TODO: This has to be a method. We also need the list of paths from the
// project.
const getAbsoluteImportPathBuilder =
  (path: string) =>
  (str: string): string => {
    const req = str //.substring(1, str.length - 1)
    if (isRequirePath(str)) {
      const parts = parsePath(path)
      const resolvedPath = resolve(join(parts.dir, req))

      // TODO: Fix this issue
      // 1 - Try to hit the path.
      // 2 - Path with .js if no extension
      // 3 - Path with index.js
      //
      // If the resolved path does not have an extension, it means it is a
      // directory and we need to add the /index.js
      // if (extname(resolvedPath) == '') return join(resolvedPath, 'index.js')
      // else resolvedPath
      return resolvedPath
    }
    return req
  }

export const isPackageImport = (i: Import): i is PackageImport =>
  i.type === 'package'
