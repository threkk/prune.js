const walker = require('acorn-walk')
import { Node } from 'acorn'

const TIMEOUT = 1000

// Non recursive function visitor which does not evaluate the body of the
// function. The body of a function would create a new scope of execution and it
// is not evaluated as part of the normal sequential evaluation of the stack.
const NonRecFuncVisitor = (node, st, c) => {
  if (node.id) c(node.id, st, 'Pattern')
  for (let param of node.params) c(param, st, 'Pattern')
}

// Classes are functions too.
const NonRecClassVisitor = (node, st, c) => {
  if (node.id) c(node.id, st, 'Pattern')
  if (node.superClass) c(node.superClass, st, 'Expression')
}

const sequentialVisitor = { ...walker.base }
sequentialVisitor.Function = NonRecFuncVisitor
sequentialVisitor.Class = NonRecClassVisitor

export async function extractStatements(ast: Node): Promise<Node[]> {
  const promise: Promise<Node[]> = new Promise(resolve => {
    let timer: NodeJS.Timeout | null = null
    const statements: Node[] = []
    const cb: (node: Node, st: Node[]) => void = (node: Node, st: Node[]) => {
      if (node.type !== 'BlockStatement') st.push(node)
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => resolve(statements), TIMEOUT)
    }

    walker.ancestor(
      ast,
      {
        ExpressionStatement: cb,
        EmptyStatement: cb,
        DebuggerStatement: cb,
        ReturnStatement: cb,
        LabeledStatement: cb,
        BreakStatement: cb,
        ContinueStatement: cb,
        IfStatement: cb,
        SwitchStatement: cb,
        ThrowStatement: cb,
        TryStatement: cb,
        WhileStatement: cb,
        DoWhileStatement: cb,
        ForStatement: cb,
        ForInStatement: cb,
        FunctionDeclaration: cb,
        VariableDeclaration: cb,
        BlockStatement: cb
      },
      sequentialVisitor,
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
