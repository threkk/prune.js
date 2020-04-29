import { make, simple } from 'acorn-walk'

// Ignores one side of an assignment expression when looking for identifiers.
type Side = 'left' | 'right'
export const ignoreSide = (side: Side) =>
  make({
    AssignmentPattern: (node: any, st: any, c: any) =>
      c(node[side], st, 'Pattern')
  })

// Finds all the identifiers from a given expression. It only parses one of the
// sides, the left one by default.
export function findIdentifiers(
  expr: any,
  excludeSide: Side = 'right'
): string[] {
  const acc: string[] = []
  const store = (node: any, acc: string[]) => {
    if (node.type === 'Identifier') acc.push(node.name!)
  }

  simple(
    expr,
    {
      AssignmentPattern: store,
      ArrayPattern: store,
      ObjectPattern: store
    },
    ignoreSide(excludeSide),
    acc
  )
  return acc
}

// Given an expression, if it is an import, find the module that is imported.
export function findModuleFromDeclaration(expr: any): string {
  const acc: string[] = []
  const cbs = {}

  if (expr.type === 'ImportDeclaration') {
    cbs['ImportDeclaration'] = (node: any, acc: string[]) =>
      acc.push(node.source.name)
  } else {
    cbs['VariableDeclaration'] = (node: any, acc: string[]) => {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        node.arguments.length === 1 &&
        node.arguments[0].type === 'Literal'
      ) {
        acc.push(node.arguments[0].value as string)
      }
    }
  }

  simple(expr, cbs, ignoreSide('left'), acc)
  return acc[0]
}

// Given a MemberExpression, return the list of chained properties as array.
export function getPropertyChain(expr: any): string[] {
  const properties = []
  if (expr.type === 'MemberExpression') {
    const { object, property } = expr

    if (object.type !== 'Identifier') {
      properties.push(...getPropertyChain(object))
    } else {
      properties.push(object.name)
    }

    if (property.type === 'Literal') {
      properties.push(property.value)
    } else if (property.type === 'Identifier' && !expr.computed) {
      properties.push(property.name)
    }
  }
  return properties
}
