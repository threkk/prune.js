import { Graph, Relationship, isStatementType } from './graph'
import { JS_BUILTINS } from './builtin'
import * as estraverse from 'estraverse'
import * as estree from 'estree'
import { ScopeManager } from 'eslint-scope'

enum VariableTypes {
  CATCH_CLAUSE = 'CatchClause',
  PARAMETER = 'Parameter',
  FUNCTION_NAME = 'FunctionName',
  CLASS_NAME = 'ClassName',
  VARIABLE = 'Variable',
  IMPORT_BINDING = 'ImportBinding',
  TDZ = 'TDZ',
  IMPLICIT_GLOBAL = 'ImplicitGlobalVariable'
}

export class GraphBuilder {
  #graph: Graph
  #sm: ScopeManager
  #ast: estree.Node

  constructor(ast: estree.Node, sm: ScopeManager) {
    this.#graph = new Graph()
    this.#sm = sm
    this.#ast = ast
  }

  generateVertices(): GraphBuilder {
    let currentScope = this.#sm.acquire(this.#ast)
    const statements = []
    estraverse.traverse(this.#ast, {
      enter: (node: estree.Node) => {
        //
        // 3. Get the current context.
        // /Function|Catch|With|Module|Class|Switch|For|Block/.test(node.type)
        if (/Function/.test(node.type)) {
          const funcScope = this.#sm.acquire(node)
          if (funcScope) currentScope = funcScope
        }

        // 2. Get the last statement the identifier found.
        if (isStatementType(node)) {
          this.#graph.addVertex({ node, scope: currentScope })
          statements.push(node)
        }

        // We need to accomplish 3 things:
      },
      leave: (node: estree.Node) => {
        if (isStatementType(node)) {
          statements.pop()
        }

        if (/Function/.test(node.type)) {
          currentScope = currentScope.upper
          // TODO: Make sure that if the scope is not acquired, it doesn't go
          // up.
        }
      }
    })

    return this
  }

  addReadWriteRelantionships(): GraphBuilder {
    for (const scope of this.#sm.scopes) {
      const lastW = new Map()
      for (const ref of scope.references) {
        // const statement = this.#am.lookupStatement(ref.identifier as any)
        const statement = this.#graph.getVertex(ref.identifier)
        if (statement == null || !ref.resolved) {
          if (ref.identifier.name in JS_BUILTINS) {
            statement.isTerminal = JS_BUILTINS[ref.identifier.name]
          }
          continue
        }

        const { name } = ref.identifier

        if (!lastW.has(name)) {
          const defs = ref.resolved.defs
          const dcl = defs[defs.length - 1].parent ?? defs[defs.length - 1].node
          // const dcl = this.#am.lookupDeclarationStatament(ref.identifier)
          if (dcl) lastW.set(name, dcl)
        }

        const dst = lastW.get(name)
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
            var: name
          })
        }

        if (ref.isWrite() || ref.isReadWrite()) {
          this.#graph.addEdge({
            dst,
            src: statement.node,
            rel: Relationship.WRITE,
            var: name
          })
          lastW.set(name, statement.node)
        }
      }
    }
    return this
  }

  linkCallParameters(): GraphBuilder {
    let currentScope = this.#sm.acquire(this.#ast)

    const checkParameter = (param: estree.Node, index: number) =>
      estraverse.traverse(param, {
        enter: (node: estree.Node) => {
          // Recursion control
          if (/Block/.test(node.type)) estraverse.VisitorOption.Skip

          if (/Identifier/.test(node.type)) {
            // 1. Search for its resolution.
            const variables = [...currentScope.variables]
            let recScope = currentScope
            while (variables.length > 0) {
              const v = variables.pop()

              if (v.name === (node as estree.Identifier).name) {
                const dst = v.defs[v.defs.length - 1].node
                // 2. Link statement with the
                const src = this.#graph.getVertex(node)
                this.#graph.addEdge({
                  dst,
                  src: src.node,
                  index,
                  var: (node as any).name,
                  rel: Relationship.PARAM
                })
              }

              if (variables.length === 0 && recScope.upper != null) {
                recScope = recScope.upper
                variables.push(...recScope.variables)
              }
            }
          }
        }
      })

    const checkArgument = (arg: estree.Node, index: number) => {
      estraverse.traverse(arg, {
        enter: node => {
          if (/Identifier/.test(node.type)) {
            for (const v of currentScope.variables) {
              if (
                v.name === (node as estree.Identifier).name &&
                v.defs[0] != null &&
                v.references[0] != null
              ) {
                // We get the vertex of the first declaration, which will be in
                // the function.
                const src = this.#graph.getVertex(v.defs[0].node)
                // and link it to the first appearece of the variable.
                const dst = this.#graph.getVertex(v.references[0].identifier)

                if (src != null && dst != null) {
                  this.#graph.addEdge({
                    src: src.node,
                    dst: dst.node,
                    index,
                    var: v.name,
                    rel: Relationship.ARG
                  })
                }
              }
            }
          }
        }
      })
    }

    estraverse.traverse(this.#ast as any, {
      enter: node => {
        if (/Function/.test(node.type)) {
          const funcScope = this.#sm.acquire(node)
          if (funcScope) currentScope = funcScope

          for (let idx = 0; idx < (node as any).params.length; idx++) {
            checkArgument((node as any).params[idx], idx)
          }
        }
        if (/CallExpression|NewExpression/.test(node.type)) {
          for (let idx = 0; idx < (node as any).arguments.length; idx++) {
            checkParameter((node as any).arguments[idx], idx)
          }
        }
      },
      leave: node => {
        if (/Function/.test(node.type)) {
          currentScope = currentScope.upper
        }
      }
    })
    return this
  }

  getGraph(): Graph {
    return this.#graph
  }
}
