const walker = require('acorn-walk')
import { Node } from 'acorn'

const storeStatement: (node: Node, st: Node[]) => void = (
  node: Node,
  st: Node[]
) => {
  if (node.type !== 'BlockStatement') st.push(node)
}

// Non recursive function visitor which does not evaluate the body of the
// function. The body of a function would create a new scope of execution and it
// is not evaluated as part of the normal sequential evaluation of the stack.
export const sequentialVisitor = walker.make(
  {
    Function: (node, st, c) => {
      if (node.id) c(node.id, st, 'Pattern')
      for (let param of node.params) c(param, st, 'Pattern')
    },
    Class: (node, st, c) => {
      if (node.id) c(node.id, st, 'Pattern')
      if (node.superClass) c(node.superClass, st, 'Expression')
    }
  },
  walker.base
)

export function extractAllStatements(ast: Node): Node[] {
  const statements: Node[] = []

  walker.simple(
    ast,
    {
      Statement: storeStatement
    },
    sequentialVisitor,
    statements
  )

  statements.sort((a, b) => {
    const cmp = a.loc.start.line - b.loc.start.line
    return cmp
  })

  return statements
}
