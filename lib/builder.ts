import { PathLike } from 'fs'
import { ASTManager, VariableTypes } from './ast'
import { Graph, Relationship } from './graph'
import { BUILTINS } from './builtin'
import { resolve, join } from 'path'
import * as estraverse from 'estraverse'
import { Node } from 'acorn'

export class GraphBuilder {
  #graph: Graph
  #am: ASTManager

  constructor(path: PathLike) {
    this.#graph = new Graph()
    this.#am = new ASTManager(path)
  }

  generateVertices(): GraphBuilder {
    let currentScope = this.#am.sm.acquire(this.#am.ast)
    const statements = []
    estraverse.traverse(this.#am.ast as any, {
      enter: node => {
        //
        // 3. Get the current context.
        // /Function|Catch|With|Module|Class|Switch|For|Block/.test(node.type)
        if (/Function/.test(node.type)) {
          const funcScope = this.#am.sm.acquire(node)
          if (funcScope) currentScope = funcScope
        }

        // 2. Get the last statement the identifier found.
        if (
          node.type !== 'BlockStatement' &&
          /Statement|Declaration/.test(node.type)
        ) {
          this.#graph.addNode(node as acorn.Node)
          statements.push(node)
        }

        // 1. Get all the identifiers.
        if (/Identifier/.test(node.type)) {
          const prev = statements[statements.length - 1]
          this.#am.trackNode({ id: node as any, st: prev, sc: currentScope })
        }
        // We need to accomplish 3 things:
      },
      leave: node => {
        if (/Statement|Declaration/.test(node.type)) {
          statements.pop()
        }

        if (/Function/.test(node.type)) {
          currentScope = currentScope.upper
        }
      }
    })

    return this
  }

  populateBuiltins(): GraphBuilder {
    const firstNode = this.#am.ast

    const addBuiltin = (name: string) => {
      const id = {
        type: 'Identifier',
        name,
        loc: null,
        start: firstNode.start,
        end: firstNode.end
      }
      this.#am.trackNode({ id, st: firstNode, sc: this.#am.sm.globalScope })
    }

    BUILTINS.forEach(builtin => addBuiltin(builtin))

    return this
  }

  addReadWriteRelantionships(): GraphBuilder {
    // A)
    // For each node
    // Look for all identifiers.
    // For each identifier.
    // Look for the declaration.
    // Look for the last write
    // If they are not null, create a relationship
    //
    // B)
    // For eacg scope, we visit all the references in every escope.

    for (const scope of this.#am.sm.scopes) {
      const lastW = new Map()
      for (const ref of scope.references) {
        const statement = this.#am.lookupStatement(ref.identifier as any)
        if (!statement || !ref.resolved) continue

        const { name } = ref.identifier

        if (!lastW.has(name)) {
          const dcl = this.#am.lookupDeclarationStatament(ref.identifier as any)
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
            src: statement,
            rel,
            var: name
          })
        }

        if (ref.isWrite() || ref.isReadWrite()) {
          this.#graph.addEdge({
            dst,
            src: statement,
            rel: Relationship.WRITE,
            var: name
          })
          lastW.set(name, statement)
        }
      }
    }
    return this
  }

  // linkFunctionCalls(): GraphBuilder {
  //   let currentScope = this.#am.sm.acquire(this.#am.ast)

  //   const checkParameter = (param: Node, index: number) =>
  //     estraverse.traverse(param, {
  //       enter: node => {
  //         // Recursion control
  //         if (/Block/.test(node.type)) estraverse.VisitorOption.Skip

  //         if (/Identifier/.test(node.type)) {
  //           // 1. Search for its resolution.
  //           const dst = this.#am.lookupDeclarationStatament(node)

  //           // 2. Link statement with the
  //           if (dst) {
  //             const src = this.#am.lookupStatement(node)
  //             this.#graph.addEdge({
  //               dst,
  //               src,
  //               index,
  //               var: node.name,
  //               rel: Relationship.ARG
  //             })
  //           }
  //         }
  //       }
  //     })

  //   estraverse.traverse(this.#am.ast as any, {
  //     enter: node => {
  //       if (/Function/.test(node.type)) {
  //         const funcScope = this.#am.sm.acquire(node)
  //         if (funcScope) currentScope = funcScope
  //       }
  //       if (/CallExpression|NewExpression/.test(node.type)) {
  //         for (let idx = 0; idx < (node as any).arguments.length; idx++) {
  //           checkParameter((node as any).arguments[idx], idx)
  //         }
  //       }
  //     },
  //     leave: node => {
  //       if (/CallExpression|NewExpression/.test(node.type)) {
  //       }

  //       if (/Function/.test(node.type)) {
  //         currentScope = currentScope.upper
  //       }
  //     }
  //   })
  //   return this
  // }

  printAsDot(): GraphBuilder {
    console.log(this.#graph.toString())
    return this
  }
}

const gb = new GraphBuilder(
  // resolve(join(process.cwd(), './test/validation/03-nested-scopes-invalid.js'))
  resolve(join(process.cwd(), './test/validation/04-function-call-valid.js'))
)

gb.generateVertices().addReadWriteRelantionships().printAsDot()
