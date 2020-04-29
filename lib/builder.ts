import { PathLike } from 'fs'
import { ASTManager } from './ast'
import { Graph, Relationship } from './graph'
import { resolve, join } from 'path'
import { Reference } from 'eslint-scope'
import { ancestor } from 'acorn-walk'
import { Node } from 'acorn'

export function buildGraph(path: PathLike): Graph {
  const graph = new Graph()
  const am = new ASTManager(path)

  const visitors = {
    // For every statement we find, we add it as a node of our graph.
    Statement(node: Node) {
      if (node.type !== 'BlockStatement') graph.addNode(node)
    },
    // Variable declarations ofthen might be tagged as Pattern, which is a
    // superclass of identifier.
    Pattern(node: Node, _: Node[], ancestor: Node[]) {
      if (/Identifier/.test(node.type)) {
        for (let i = ancestor.length - 1; i >= 0; i--) {
          const prev = ancestor[i]
          if (/Statement/.test(prev.type) || /Declaration/.test(prev.type)) {
            am.trackNode({ id: node, st: prev })
            return
          }
        }

        console.log(`Statement not found for ${(node as any).name}`)
        console.log(
          'Ancestors:',
          ancestor.map(n => n.type)
        )
      }
    },
    Identifier(node: Node, _: Node[], ancestor: Node[]) {
      for (let i = ancestor.length - 1; i >= 0; i--) {
        const prev = ancestor[i]
        if (/Statement/.test(prev.type) || /Declaration/.test(prev.type)) {
          am.trackNode({ id: node, st: prev })
          return
        }
      }

      console.log(`Statement not found for ${(node as any).name}`)
      console.log(
        'Ancestors:',
        ancestor.map(n => n.type)
      )
    }
  }

  // @ts-ignore
  ancestor(am.sm.globalScope.block, visitors)

  // TODO: Nodes not getting stored in the graph (?????)
  console.log(graph.getNodesSize(), graph.getAllNodes().length)

  return graph
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

buildGraph(
  resolve(join(process.cwd(), './test/validation/03-nested-scopes-invalid.js'))
)
