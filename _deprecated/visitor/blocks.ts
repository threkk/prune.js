const walker = require('acorn-walk')
import { Node } from 'acorn'

const storeStatement: (node: Node, st: Node[]) => void = (
  node: Node,
  st: Node[]
) => {
  if (node.type !== 'BlockStatement') st.push(node)
}

// The block visitor extracts all the statements of this concrete block. It
// requires recursion to properly align scopes.
export const blockVisitor = walker.make(
  { BlockStatement: () => {} },
  walker.base
)

export function extractBlockStatements(ast: Node): Node[] {
  const statements: Node[] = []

  walker.simple(
    ast,
    {
      Statement: storeStatement
    },
    blockVisitor,
    statements
  )

  statements.sort((a, b) => {
    const cmp = a.loc.start.line - b.loc.start.line
    return cmp
  })

  return statements
}
