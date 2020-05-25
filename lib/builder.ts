import { PathLike } from 'fs'
import { ASTManager } from './ast'
import { Graph, Relationship } from './graph'
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
        loc: firstNode.loc,
        start: firstNode.start,
        end: firstNode.end
      }
      this.#am.trackNode({ id, st: firstNode, sc: this.#am.sm.globalScope })
    }

    // Source https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
    // Values
    addBuiltin('Infinity')
    addBuiltin('NaN')
    addBuiltin('undefined')
    addBuiltin('globalThis')

    // Function properties
    addBuiltin('eval')
    addBuiltin('isFinite')
    addBuiltin('isNan')
    addBuiltin('parseFloat')
    addBuiltin('parseInt')
    addBuiltin('decodeURI')
    addBuiltin('decodeURIComponent')
    addBuiltin('encodeURI')
    addBuiltin('encodeURIComponent')

    // Fundamental objects
    addBuiltin('Object')
    addBuiltin('Function')
    addBuiltin('Boolean')
    addBuiltin('Symbol')

    // Error objects
    addBuiltin('Error')
    addBuiltin('AggregateError')
    addBuiltin('EvalError')
    addBuiltin('InternalError')
    addBuiltin('RangeError')
    addBuiltin('ReferenceError')
    addBuiltin('SyntaxError')
    addBuiltin('TypeError')
    addBuiltin('URIError')

    // Numbers and dates
    addBuiltin('Number')
    addBuiltin('BigInt')
    addBuiltin('Math')
    addBuiltin('Date')

    // Text processing
    addBuiltin('String')
    addBuiltin('RegExp')

    // Indexed collections
    addBuiltin('Array')
    addBuiltin('Int8Array')
    addBuiltin('Uint8Array')
    addBuiltin('Uint8ClampedArray')
    addBuiltin('Int16Array')
    addBuiltin('Uint16Array')
    addBuiltin('Int32Array')
    addBuiltin('Uint32Array')
    addBuiltin('Float32Array')
    addBuiltin('Float64Array')
    addBuiltin('BigInt64Array')
    addBuiltin('BigUint64Array')

    // Keyed collections
    // Structured data
    // Control abstraction
    // Reflection
    // Internationalization
    // WebAssembly

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
      for (const ref of scope.references) {
        const ident: Node = ref.identifier as any
        const statement = this.#am.lookupStatement(ident)

        if (!statement || !ref.resolved) continue
        const src = this.#graph.getNode(statement)
        const declaration = this.#am.lookupDeclarationStatament(ident)

        if (declaration) {
          const dcl = this.#graph.getNode(declaration)
          if (dcl) {
            this.#graph.addEdge({
              src,
              dst: dcl,
              rels: [Relationship.DECL]
            })
          }
        }

        const lastResolvedDef = ref.resolved.defs[ref.resolved.defs.length - 1]
        const lastResolvedDefStatement = this.#graph.getNode(
          lastResolvedDef.node
        )

        if (lastResolvedDefStatement) {
          const rels = []
          if (ref.isRead() || ref.isReadWrite()) {
            rels.push(Relationship.READ)
          }

          if (ref.isWrite() || ref.isReadWrite()) {
            rels.push(Relationship.WRITE)
          }

          if (rels.length > 0) {
            this.#graph.addEdge({
              src,
              dst: lastResolvedDefStatement,
              rels
            })
          }
        }
      }
    }
    return this
  }

  printAsDot(): GraphBuilder {
    console.log(this.#graph.toString())
    return this
  }
}

const gb = new GraphBuilder(
  // resolve(join(process.cwd(), './test/validation/03-nested-scopes-invalid.js'))
  resolve(join(process.cwd(), './test/validation/03-nested-scopes-invalid.js'))
)

gb.generateVertices().addReadWriteRelantionships().printAsDot()
