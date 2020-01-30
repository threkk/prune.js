import { Node } from 'acorn'
import { ScopeSetter, ScopeVariable, Scope } from '../scope'
import { getPropertyChain } from './expression'

const walker = require('acorn-walk')

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

function getCallee(node: any, scope: Scope): ScopeVariable {
  let func: ScopeVariable = null
  switch (node.callee.type) {
    case 'Identifier':
      const identifier = node.callee.name
      func = scope.get(identifier)
      if (!func || !func.isCallable || !func.callable) {
        console.debug(`${identifier} not found.`)
        return null
      }
      return func
    case 'MemberExpression':
      const properties = getPropertyChain(node.callee.left)
      func = scope.get(properties)

      if (!func || !func.isCallable || !func.callable) {
        console.debug(`${node.calee.left} not found.`)
        return null
      }
      return func
  }
  return func
}

export function onCallStatement(
  ast: any,
  scope: Scope,
  callback: (err: Error, node: any, func?: ScopeVariable) => void
): void {
  walker.simple(
    ast,
    {
      CallExpression(node: any) {
        const callee = getCallee(node, scope)
        callback(null, node, callee)
      },
      NewExpression(node: any) {
        const callee = getCallee(node, scope)
        callback(null, node, callee)
      }
    },
    sequentialVisitor
  )
}
