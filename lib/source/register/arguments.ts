import { ScopeVariable, ScopeSetter } from '../scope'
import { findIdentifiers } from '../visitor/expression'

// TODO: Make it work with classes.
export function getArgumentsSettersFromDecl(val: ScopeVariable): ScopeSetter[] {
  const setters: ScopeSetter[] = []

  if (
    val &&
    val.isCallable &&
    val.callable &&
    val.callable.type === 'Function'
  ) {
    const baseVariable: ScopeVariable = {
      id: null,
      declarationSt: val.declarationSt,
      hasProperties: false,
      isImport: false,
      isExport: false,
      properties: {},
      isCallable: false
    }
    ;(val.callable as any).params.forEach((param: any, index: number) => {
      switch (param.type) {
        case 'Identifier':
          // Example: function f (a, b) {}
          setters.push({
            key: param.name,
            value: { ...baseVariable, id: param.name }
          })
          break
        case 'RestElement':
          // Example: function f (...a) {}
          //
          // This is assuming that every rest elment (...foo) has only one level
          // of deepness. If it goes deeper probably will be undefined.
          // TODO: Get the properties from the variable if possible
          setters.push({
            key: param.argument.name,
            value: {
              ...baseVariable,
              id: param.argument.name,
              hasProperties: true,
              properties: {}
            }
          })
          break
        case 'ArrayPattern':
          // Example: function f ([ a, b ]) {}
          findIdentifiers(param.elements).forEach(id =>
            setters.push({
              key: id,
              value: { ...baseVariable, id }
            })
          )
          break
        case 'ObjectPattern':
          // Example: function f ({ a, b }) {}
          param.elements
            .flatMap(property => findIdentifiers(property.key, 'right'))
            .forEach(id =>
              setters.push({ key: id, value: { ...baseVariable, id } })
            )
          break
        case 'AssignmentPattern':
          // Example: function f (a = 'a') {}
          findIdentifiers(param, 'right').forEach(id =>
            setters.push({ key: id, value: { ...baseVariable, id } })
          )
          break
      }
    })

    // 'arguments' variable
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
    setters.push(args)

    // 'this' variable
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
    setters.push(that)
  }

  return setters
}

// TODO: Map values with the variables if they are callable.
function getArgumentsFromCallExpression(callStatement: any): ScopeVariable[] {
  return []
}
