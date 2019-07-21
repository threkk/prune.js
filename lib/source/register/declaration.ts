import { Declarator, ScopeVariable, ScopeSetter, Scope } from '../scope'
import {
  findIdentifiers,
  findModuleFromDeclaration,
  getPropertyChain
} from '../visitor/expression'

const isCallable: (expr: any) => boolean = (expr: any) =>
  (expr.init &&
    (expr.init.type === 'FunctionExpression' ||
      expr.init.type === 'ArrowFunctionExpression' ||
      expr.init.type === 'ClassExpression')) ||
  false
const hasProperties: (expr: any) => boolean = expr =>
  expr.value.type === 'ObjectExpression'

function findProperties(
  expr: any,
  statement: any,
  scope: Scope
): { [index: string]: ScopeVariable } {
  const properties = {}
  if (expr.type === 'ObjectExpression') {
    for (const prop of expr.properties) {
      if (prop.type === 'Property') {
        const key: string =
          prop.key.type === 'Literal' ? prop.key.value : prop.key.name
        const value: ScopeVariable = {
          id: key,
          isImport: false,
          isCallable: isCallable(expr),
          hasProperties: hasProperties(expr),
          isExport: false,
          declarationSt: statement,
          properties: hasProperties(expr)
            ? findProperties(prop.value, statement, scope)
            : {}
        }

        properties[key] = value
      } else if (prop.type === 'RestElement') {
        if (prop.argument.type === 'Identifier') {
          const refObj = scope.get(prop.argument.name)
          Object.entries(refObj.properties).forEach(([key, value]) => {
            properties[key] = value
          })
        }
      }
    }
  }
  return properties
}

export function getDeclarationSetters(st: any, scope: Scope): ScopeSetter[] {
  const declarations: ScopeSetter[] = []
  switch (st.type) {
    case 'VariableDeclaration':
      let kind: Declarator
      switch (st.kind) {
        case 'const':
          kind = Declarator.CONST
          break
        case 'let':
          kind = Declarator.LET
          break
        case 'var':
        default:
          kind = Declarator.VAR
      }

      st.declarations.forEach(decl => {
        const ids = findIdentifiers(decl)
        const mod = findModuleFromDeclaration(decl)
        const properties =
          decl.init && decl.init.type === 'ObjectExpression'
            ? findProperties(decl.init, decl, scope)
            : {}

        ids.forEach(id =>
          declarations.push({
            key: id,
            value: {
              id,
              isImport: mod != null,
              isCallable: isCallable(decl),
              isExport: false,
              callable: isCallable ? decl.init : null,
              declarationSt: st,
              sourceModule: mod !== '' ? mod : '',
              hasProperties: hasProperties(decl),
              properties
            },
            declarator: kind
          })
        )
      })
      break
    case 'ImportDeclaration':
      const ids: string[] = st.specifiers.map(sp => sp.local.name)
      ids.forEach((id: string) =>
        declarations.push({
          key: id,
          value: {
            id,
            isCallable: false,
            isImport: true,
            isExport: false,
            declarationSt: st,
            sourceModule: st.source.name,
            hasProperties: false,
            properties: {}
          }
        })
      )
      break
    case 'ClassDeclaration':
      // TODO: Add methods to properties.
      declarations.push({
        key: st.id.name,
        value: {
          id: st.id.name,
          isImport: false,
          isExport: false,
          isCallable: true,
          callable: st,
          declarationSt: st,
          properties: {},
          hasProperties: true
        },
        declarator: Declarator.CLASS
      })
      break
    case 'ExpressionStatement':
      if (st.expression.type === 'AssignmentExpression') {
        const { left, right } = st.expression

        // Expression type: a.b
        if (left.type === 'MemberExpression') {
          const [obj, ...properties] = getPropertyChain(left)
          const lastProp: string = properties.pop()

          const baseScope = scope.get(obj)
          if (!baseScope) break

          const variable = properties.reduce((prev, curr) => {
            if (prev === null) return null
            return prev.properties[curr] || null
          }, baseScope)

          if (!variable) break

          // Add/update only if it does not exist or is callable.
          if (!variable.properties[lastProp] || isCallable) {
            variable.properties[lastProp] = {
              id: lastProp,
              isCallable: isCallable(right),
              callable: isCallable(right) ? st : null,
              isImport: false,
              isExport: false,
              declarationSt: st,
              hasProperties: hasProperties(variable),
              properties: {}
            }
          }
        } else if (left.type === 'Identifier') {
          const id = left.name
          if (scope.get(id) === null) {
            declarations.push({
              key: id,
              value: {
                id,
                hasProperties: false,
                properties: {},
                declarationSt: st,
                isExport: false,
                isImport: false,
                isCallable: isCallable(right),
                callable: isCallable(right) ? st : null
              }
            })
          } else if (isCallable(right)) {
            const variable = scope.get(id)
            variable.isCallable = true
            variable.callable = st
          }
        }
      }
      break
    default:
    // console.debug(`Found ${props.st.type}, skipping...`)
  }
  return declarations
}
