import { Graph, Relationship, isStatementType } from './graph'
import { JS_BUILTINS } from './builtin'
import * as estraverse from 'estraverse'
import {
  Node,
  Identifier,
  Function,
  CallExpression,
  ReturnStatement,
} from 'estree'
import { ScopeManager } from 'eslint-scope'

enum VariableTypes {
  CATCH_CLAUSE = 'CatchClause',
  PARAMETER = 'Parameter',
  FUNCTION_NAME = 'FunctionName',
  CLASS_NAME = 'ClassName',
  VARIABLE = 'Variable',
  IMPORT_BINDING = 'ImportBinding',
  TDZ = 'TDZ',
  IMPLICIT_GLOBAL = 'ImplicitGlobalVariable',
}

// const FUNC_SCOPE = /Function|Catch|With|Module|Class|Switch|For|Block/
const FUNC_SCOPE = /Function|With|Module|Class/

class GraphBuilder {
  #graph: Graph
  #sm: ScopeManager
  #ast: Node

  constructor(path: string, ast: Node, sm: ScopeManager) {
    this.#graph = new Graph(path)
    this.#sm = sm
    this.#ast = ast

    this.generateVertices()
    this.linkReadWrite()
    this.linkCallParameters()
  }

  private generateVertices(): void {
    let currentScope = this.#sm.acquire(this.#ast)
    let currentParent = null
    estraverse.traverse(this.#ast, {
      enter: (node: Node) => {
        //
        // 3. Get the current context.
        // /Function|Catch|With|Module|Class|Switch|For|Block/.test(node.type)
        if (FUNC_SCOPE.test(node.type)) {
          const funcScope = this.#sm.acquire(node)
          if (funcScope) currentScope = funcScope
        }

        // 2. Get the last statement the identifier found.
        if (isStatementType(node) && node.type !== 'BlockStatement') {
          const vertex = this.#graph.addVertex({
            node,
            parent: currentParent,
            scope: currentScope,
          })
          if (currentParent) currentParent.block.push(vertex)
          if (FUNC_SCOPE.test(node.type)) currentParent = vertex
        }
        // We need to accomplish 3 things:
      },
      leave: (node: Node) => {
        if (FUNC_SCOPE.test(node.type)) {
          currentScope = currentScope.upper

          if (currentParent) currentParent = currentParent.parent?.node ?? null

          // TODO: Make sure that if the scope is not acquired, it doesn't go
          // up.
        }
      },
    })
  }

  private linkReadWrite() {
    for (const scope of this.#sm.scopes) {
      const lastWrite = new Map()

      for (const ref of scope.references) {
        const statement = this.#graph.getVertexByNode(ref.identifier)
        if (statement == null || !ref.resolved) {
          if (ref.identifier.name in JS_BUILTINS) {
            statement.isTerminal = JS_BUILTINS[ref.identifier.name]
          }
          continue
        }

        const { name } = ref.identifier

        if (!lastWrite.has(name)) {
          const defs = ref.resolved.defs
          if (defs.length > 0) {
            const dcl =
              defs[defs.length - 1].parent ?? defs[defs.length - 1].node
            // const dcl = this.#am.lookupDeclarationStatament(ref.identifier)
            if (dcl) lastWrite.set(name, dcl)
          }
        }

        const dst = lastWrite.get(name)
        if (!dst) continue

        if (ref.isRead() || ref.isReadWrite()) {
          let rel = Relationship.READ
          const refType = ref.resolved.defs[ref.resolved.defs.length - 1].type
          if (
            refType === VariableTypes.CLASS_NAME.valueOf() ||
            refType === VariableTypes.FUNCTION_NAME.valueOf()
          ) {
            rel = Relationship.CALL
          }
          this.#graph.addEdge({
            dst,
            src: statement.node,
            rel,
            var: name,
          })
        }

        if (ref.isWrite() || ref.isReadWrite()) {
          this.#graph.addEdge({
            dst,
            src: statement.node,
            rel: Relationship.WRITE,
            var: name,
          })
          lastWrite.set(name, statement.node)
        }
      }
    }
  }

  private linkCallParameters(): void {
    let currentScope = this.#sm.acquire(this.#ast)

    const checkParameter = (param: Node, index: number) =>
      estraverse.traverse(param, {
        enter: (node: Node) => {
          // Recursion control
          if (/Block/.test(node.type)) estraverse.VisitorOption.Skip

          if (isIdentifier(node)) {
            // 1. Search for its resolution.
            const variables = [...currentScope.variables]
            let recScope = currentScope
            while (variables.length > 0) {
              const v = variables.pop()

              if (v.name === node.name && v.defs.length > 0) {
                const dst = v.defs[v.defs.length - 1].node
                // 2. Link statement with the
                const src = this.#graph.getVertexByNode(node)
                this.#graph.addEdge({
                  dst,
                  src: src.node,
                  index,
                  var: (node as any).name,
                  rel: Relationship.PARAM,
                })
              }

              if (variables.length === 0 && recScope.upper != null) {
                recScope = recScope.upper
                variables.push(...recScope.variables)
              }
            }
          }
        },
      })

    const checkArgument = (arg: Node, index: number) => {
      estraverse.traverse(arg, {
        enter: (node) => {
          if (isIdentifier(node)) {
            for (const v of currentScope.variables) {
              if (
                v.name === node.name &&
                v.defs[0] != null &&
                v.references[0] != null
              ) {
                // We get the vertex of the first declaration, which will be in
                // the function.
                const src = this.#graph.getVertexByNode(v.defs[0].node)
                // and link it to the first appearece of the variable.
                const dst = this.#graph.getVertexByNode(
                  v.references[0].identifier
                )

                if (src != null && dst != null) {
                  this.#graph.addEdge({
                    src: src.node,
                    dst: dst.node,
                    index,
                    var: v.name,
                    rel: Relationship.ARG,
                  })
                }
              }
            }
          }
        },
      })
    }

    estraverse.traverse(this.#ast, {
      enter: (node) => {
        if (isLikeFunctionDeclaration(node)) {
          const funcScope = this.#sm.acquire(node)
          if (funcScope) currentScope = funcScope

          for (let idx = 0; idx < node.params.length; idx++) {
            checkArgument((node as any).params[idx], idx)
          }
        }
        if (isLikeCallExpression(node)) {
          for (let idx = 0; idx < node.arguments.length; idx++) {
            checkParameter(node.arguments[idx], idx)
          }
        }
        if (isLikeReturnStatement(node)) {
          const vertex = this.#graph.getVertexByNode(node)

          if (vertex.parent) {
            // TODO: This could be better if we accept also vertex instead of
            // node as input paramter.
            vertex.graph.addEdge({
              src: vertex.node,
              dst: vertex.parent.node,
              rel: Relationship.RETURN,
            })
          }
        }
      },
      leave: (node) => {
        if (FUNC_SCOPE.test(node.type)) {
          currentScope = currentScope.upper
        }
      },
    })
  }

  getGraph(): Graph {
    return this.#graph
  }
}

export function buildGraph(path: string, ast: Node, sm: ScopeManager): Graph {
  const gb = new GraphBuilder(path, ast, sm)
  return gb.getGraph()
}

function isIdentifier(node: Node): node is Identifier {
  return /Identifier/.test(node.type)
}

function isLikeCallExpression(node: Node): node is CallExpression {
  return /CallExpression|NewExpression/.test(node.type)
}

function isLikeFunctionDeclaration(node: Node): node is Function {
  return /Function/.test(node.type)
}

function isLikeReturnStatement(node: Node): node is ReturnStatement {
  return node.type === 'ReturnStatement'
}
