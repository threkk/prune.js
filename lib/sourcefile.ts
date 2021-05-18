import { resolve, join, parse as parsePath } from 'path'
import { readFileSync, PathLike } from 'fs'
import { ScopeManager, analyze } from 'eslint-scope'
import { traverse } from 'estraverse'
import * as estree from 'estree'

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
  var: string
  vertex: StatementVertex
  absolutePath: string
}

export class SourceFile {
  #path: Readonly<string>
  #sm: Readonly<ScopeManager>
  #ast: Readonly<estree.Node>
  #graph: Graph
  #exports: Export[]
  #imports: Import[]

  constructor(path: string, jsx: boolean = false) {
    this.#path = path
    this.#graph = null
    this.#imports = []
    this.#exports = []

    const content: string = readFileSync(this.#path, 'utf-8')
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

    this.#graph = buildGraph(this.#path, this.#ast, this.#sm)

    this.registerExports()
    this.registerImports()
  }

  getHash() {
    return hash(this.#path)
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
                // We need to remove the extension to match the imports
                // behaviour.
                const pathObj = parsePath(this.getAbsFilePath().toString())
                this.#exports.push({
                  var: edge.var,
                  vertex,
                  absolutePath: join(pathObj.dir, pathObj.name),
                })
              }
            }
          }
        },
      })
    }
  }

  private registerImports() {
    const getRelativePath = (str: string) => str.substring(1, str.length - 1)
    const getAbsolutePath = (str: string) =>
      isRequirePath(str)
        ? resolve(join(this.getAbsFilePath(), str.substring(1, str.length - 1)))
        : str.substring(1, str.length - 1)

    for (const vertex of this.#graph.getAllVertices()) {
      traverse(vertex.node, {
        enter: (node: estree.Node) => {
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
                    relativePath: getRelativePath(node.source.value.toString()),
                    absolutePath: getAbsolutePath(node.source.value.toString()),
                  },
                }
              } else {
                return {
                  ...base,
                  imported: MODULE_DEFAULT,
                  type: 'package',
                  name: node.source.value.toString(),
                }
              }
            }

            for (const spec of node.specifiers) {
              switch (spec.type) {
                case 'ImportDefaultSpecifier':
                  this.#imports.push(
                    makeImport(spec.local.name, MODULE_DEFAULT)
                  )
                  break
                case 'ImportNamespaceSpecifier':
                  this.#imports.push(
                    makeImport(spec.local.name, MODULE_NAMESPACE)
                  )
                  break
                case 'ImportSpecifier':
                  this.#imports.push(
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
                  const isPath = isRequirePath(reqImport)
                  if (declarator.id.type === 'Identifier') {
                    const base = {
                      vertex,
                      local: declarator.id.name,
                      imported: MODULE_NAMESPACE,
                    }
                    if (isPath) {
                      this.#imports.push({
                        ...base,
                        type: 'path',
                        path: {
                          relativePath: getRelativePath(reqImport),
                          absolutePath: getAbsolutePath(reqImport),
                        },
                      })
                    } else {
                      this.#imports.push({
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
                        this.#imports.push({
                          ...base,
                          type: 'path',
                          path: {
                            relativePath: getRelativePath(reqImport),
                            absolutePath: getAbsolutePath(reqImport),
                          },
                        })
                      } else {
                        this.#imports.push({
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
                    this.#imports.push({
                      ...base,
                      type: 'path',
                      path: {
                        relativePath: getRelativePath(requireImport),
                        absolutePath: getAbsolutePath(requireImport),
                      },
                    })
                  } else {
                    this.#imports.push({
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
                const isPath = isRequirePath(requireImport)
                const base = {
                  vertex,
                  local: null,
                  imported: MODULE_NAMESPACE,
                }
                if (isPath) {
                  this.#imports.push({
                    ...base,
                    type: 'path',
                    path: {
                      relativePath: getRelativePath(requireImport),
                      absolutePath: getAbsolutePath(requireImport),
                    },
                  })
                } else {
                  this.#imports.push({
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

  getLinkedSourceFiles(): string[] {
    return this.#exports.map((el) => el.absolutePath)
  }

  getExports(): Export[] {
    return this.#exports
  }

  getImports(): Import[] {
    return this.#imports
  }

  getAbsFilePath(): Readonly<string> {
    return this.#path
  }

  getGraph(): Graph {
    return this.#graph
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
  const cleanStr = str.substring(1, str.length - 1)
  // https://nodejs.org/en/knowledge/getting-started/what-is-require/
  return (
    cleanStr.startsWith('./') ||
    cleanStr.startsWith('/') ||
    cleanStr.startsWith('../')
  )
}

function getRequireString(node: estree.Node): string | null {
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal'
  ) {
    const arg: estree.Literal = node.arguments[0]
    return arg.raw
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
                : (prop.key as estree.Literal).raw!
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
