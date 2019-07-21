import { ScopeVariable, ScopeSetter } from '../scope'

// TODO: It only works for functions
export function getArgumentsSettersFromDecl(val: ScopeVariable): ScopeSetter[] {
  const setters: ScopeSetter[] = []
  if (val.isCallable && val.callable && val.callable.type === 'Function') {
    ;(val.callable as any).params.forEach((param: any) => {
      let id = null
      if (param.type === 'Identifier') id = param.name
      else if (param.type === 'RestElement') id = param.argument.name
      // This is assuming that every rest elment (...foo) has only one level
      // of deepness. If it goes deeper probably will be undefined.

      if (id) {
        const value = {
          id,
          declarationSt: val.declarationSt,
          hasProperties: false,
          isImport: false,
          isExport: false,
          isCallable: false,
          properties: {}
        }
        setters.push({ key: id, value })
      }
    })
    const properties = {}
    for (let index in setters) properties[index] = setters[index]

    const args = {
      key: 'arguments',
      value: {
        id: 'arguments',
        declarationSt: val.declarationSt,
        hasProperties: true,
        isImport: false,
        isExport: false,
        isCallable: false,
        properties
      }
    }

    const that = {
      key: 'this',
      value: {
        id: 'this',
        declarationSt: val.declarationSt,
        isImport: false,
        isExport: false,
        isCallable: false,
        hasProperties: true,
        properties: {}
      }
    }
    setters.push(args)
    setters.push(that)
  }

  return setters
}

export function getArgumentsFromCallExpression(
  callStatement: any
): ScopeVariable[] {
  return []
}
