import { PathLike } from 'fs'
import { ASTManager } from './ast'
import { Graph, Relationship } from './graph'
import { resolve, join } from 'path'
import { Reference } from 'eslint-scope'
import { ancestor } from 'acorn-walk'
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
    // const visitors = {
    //   // For every statement we find, we add it as a node of our graph.
    //   Statement: (node: Node) => {
    //     if (node.type !== 'BlockStatement') this.#graph.addNode(node)
    //   },
    //   // Variable declarations ofthen might be tagged as Pattern, which is a
    //   // superclass of identifier.
    //   Pattern: (node: Node, _: Node[], ancestor: Node[]) => {
    //     if (/Identifier/.test(node.type)) {
    //       for (let i = ancestor.length - 1; i >= 0; i--) {
    //         const prev = ancestor[i]
    //         if (/Statement/.test(prev.type) || /Declaration/.test(prev.type)) {
    //           this.#am.trackNode({ id: node, st: prev })
    //           console.log(prev)
    //           return
    //         }
    //       }

    //       console.log(`Statement not found for ${(node as any).name}`)
    //       console.log(
    //         'Ancestors:',
    //         ancestor.map(n => n.type)
    //       )
    //     }
    //   },
    //   Identifier: (node: Node, _: Node[], ancestor: Node[]) => {
    //     for (let i = ancestor.length - 1; i >= 0; i--) {
    //       const prev = ancestor[i]
    //       if (/Statement/.test(prev.type) || /Declaration/.test(prev.type)) {
    //         this.#am.trackNode({ id: node, st: prev })
    //         return
    //       }
    //     }

    //     console.log(`Statement not found for ${(node as any).name}`)
    //     console.log(
    //       'Ancestors:',
    //       ancestor.map(n => n.type)
    //     )
    //   }
    // }

    // // @ts-ignore
    // ancestor(this.#am.sm.globalScope.block, visitors)

    let currentScope = this.#am.sm.acquire(this.#am.ast)
    const statements = []
    estraverse.traverse(this.#am.ast as any, {
      enter: (node, parent) => {
        //
        // 3. Get the current context.
        // /Function|Catch|With|Module|Class|Switch|For|Block/.test(node.type)
        if (/Function/.test(node.type)) {
          if (this.#am.sm.acquire(node))
            currentScope = this.#am.sm.acquire(node)
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
      leave: (node, parent) => {
        if (/Statement|Declaration/.test(node.type)) {
          statements.pop()
        }

        if (
          /Function|Catch|With|Module|Class|Switch|For|Block/.test(node.type)
        ) {
          currentScope = currentScope.upper
        }
      }
    })

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

        if (!statement) continue
        const src = this.#graph.getNode(statement)
        const declaration = this.#am.lookupDeclarationStatament(ident)

        if (declaration) {
          const dcl = this.#graph.getNode(declaration)
          if (declaration) {
            this.#graph.addEdge({
              src,
              dst: dcl,
              rels: [Relationship.DECL]
            })
          }
        }

        // TODO: Rethink this.
        // const lastWrite = this.#am.lookUpLastWriteStatement(ident)
        // if (lastWrite) {
        //   const lw = this.#graph.getNode(lastWrite)
        //   if (lastWrite) {
        //     this.#graph.addEdge({
        //       src,
        //       dst: lw,
        //       rels: getRelationship(ref)
        //     })
        //   }
        // }
      }
    }
    return this
  }

  printAsDot(): GraphBuilder {
    console.log(this.#graph.toDot())
    return this
  }
}

function getRelationship(ref: Reference): Relationship[] {
  const rels = []
  if (ref.isRead()) {
    rels.push(Relationship.READ)
  }

  if (ref.isWrite()) {
    rels.push(Relationship.WRITE)
  }

  return rels
}

const gb = new GraphBuilder(
  // resolve(join(process.cwd(), './test/validation/03-nested-scopes-invalid.js'))
  resolve(join(process.cwd(), './test/validation/01-variable-reading-valid.js'))
)

gb.generateVertices().addReadWriteRelantionships().printAsDot()
