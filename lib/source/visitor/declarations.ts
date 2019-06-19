const walker = require('acorn-walk')
import { Node } from 'acorn'

const NO_OP: () => void = () => {}
const TIMEOUT = 1000

const declarationVisitor = { ...walker.base }
declarationVisitor.BlockStatement = NO_OP

/**
 * Given a
 */
export async function extractDeclarations(ast: Node): Promise<Node[]> {
  const promise: Promise<Node[]> = new Promise(resolve => {
    let timer: NodeJS.Timeout | null = null
    const statements: Node[] = []
    const cb: (node: Node, st: Node[]) => void = (node: Node, st: Node[]) => {
      st.push(node)
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => resolve(statements), TIMEOUT)
    }

    walker.simple(
      ast,
      {
        FunctionDeclaration: cb,
        VariableDeclaration: cb
      },
      declarationVisitor,
      statements
    )
  })
  const statements: Node[] = await promise

  statements.sort((a, b) => {
    const cmp = a.loc.start.line - b.loc.start.line
    return cmp
  })

  return statements
}
