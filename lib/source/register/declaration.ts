import { RegisterProps } from './interface'
import { Declarator, ScopeVariable } from '../scope'
import { hash } from '../call-graph'
import { sequentialVisitor } from '../visitor/statements'
import walker = require('acorn-walk')

// Ignores one side of an assignment expression when looking for identifiers.
type Side = 'left' | 'right'
const ignoreSide = (side: Side) =>
  walker.make(
    {
      AssignmentPattern: (node, st, c) => c(node[side], st, 'Pattern')
    },
    walker.base
  )

export function findIdentifiers(expr, side: Side = 'right'): string[] {
  const acc: string[] = []
  walker.simple(
    expr,
    {
      Pattern(node, acc: string[]) {
        if (node.type === 'Identifier') acc.push(node.name)
      }
    },
    ignoreSide(side),
    acc
  )
  return acc
}

function findModuleFromDeclaration(expr): string {
  const acc: string[] = []
  const cbs = {}

  if (expr.type === 'ImportDeclaration') {
    cbs['ImportDeclaration'] = (node, acc: string[]) =>
      acc.push(node.source.name)
  } else {
    cbs['VariableDeclaration'] = (node, acc: string[]) => {
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

  walker.simple(expr, cbs, ignoreSide('left'), acc)
  return acc[0]
}

function getPropertyChain(expr): string[] {
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

function findProperties(expr, props): { [index: string]: ScopeVariable } {
  const properties = {}
  if (expr.type === 'ObjectExpression') {
    for (const prop of expr.properties) {
      if (prop.type === 'Property') {
        const key: string =
          prop.key.type === 'Literal' ? prop.key.value : prop.key.name
        const value = {
          id: key,
          loc: props.st.loc,
          isImport: false,
          declarationSt: props.st,
          hash: hash(props.st),
          properties:
            prop.value.type === 'ObjectExpression'
              ? findProperties(prop.value, props)
              : {}
        }

        properties[key] = value
      } else if (prop.type === 'SpreadElement') {
        if (prop.argument.type === 'Identifier') {
          const refObj = props.scope.get(prop.argument.name)
          Object.entries(refObj.properties).forEach(([key, value]) => {
            properties[key] = value
          })
        }
      }
    }
  }
  return properties
}

export function registerDeclarations(props: RegisterProps): void {
  switch (props.st.type) {
    case 'FunctionDeclaration':
      props.scope.add({
        key: props.st.id.name,
        value: {
          id: props.st.id.name,
          isCallable: false,
          callable: props.st,
          isImport: false,
          declarationSt: props.st,
          hash: hash(props.st),
          properties: {}
        },
        declarator: Declarator.FUNC
      })
      break
    case 'VariableDeclaration':
      let kind: Declarator
      switch (props.st.kind) {
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

      props.st.declarations.forEach(decl => {
        const ids = findIdentifiers(decl)
        const mod = findModuleFromDeclaration(decl)
        const properties =
          decl.init && decl.init.type === 'ObjectExpression'
            ? findProperties(decl.init, props)
            : {}

        const isCallable =
          (decl.init &&
            (decl.init.type === 'FunctionExpression' ||
              decl.init.type === 'ArrowFunctionExpression' ||
              decl.init.type === 'ClassExpression')) ||
          false

        ids.forEach(id =>
          props.scope.add({
            key: id,
            value: {
              id,
              isImport: mod != null,
              isCallable,
              callable: isCallable ? decl.init : null,
              declarationSt: props.st,
              hash: hash(props.st),
              sourceModule: mod !== '' ? mod : '',
              properties
            },
            declarator: kind
          })
        )
      })
      break
    case 'ImportDeclaration':
      const ids: string[] = props.st.specifiers.map(sp => sp.local.name)
      ids.forEach((id: string) =>
        props.scope.add({
          key: id,
          value: {
            id,
            isCallable: false,
            isImport: true,
            declarationSt: props.st,
            hash: hash(props.st),
            sourceModule: props.st.source.name,
            properties: {}
          }
        })
      )
      break
    case 'ClassDeclaration':
      props.scope.add({
        key: props.st.id.name,
        value: {
          id: props.st.id.name,
          isImport: false,
          isCallable: true,
          callable: props.st,
          declarationSt: props.st,
          hash: hash(props.st),
          properties: {}
        },
        declarator: Declarator.CLASS
      })
    case 'ExpressionStatement':
      if (props.st.expression.type === 'AssignmentExpression') {
        const { left, right } = props.st.expression

        const isCallable =
          (right.init &&
            (right.init.type === 'FunctionExpression' ||
              right.init.type === 'ArrowFunctionExpression' ||
              right.init.type === 'ClassExpression')) ||
          false

        // Expression type: a.b
        if (left.type === 'MemberExpression') {
          const [obj, ...properties] = getPropertyChain(left)
          const lastProp: string = properties.pop()

          const baseScope = props.scope.get(obj)
          if (baseScope) {
            const variable = properties.reduce((prev, curr) => {
              if (prev === null) return null
              return prev.properties[curr] || null
            }, baseScope)

            if (variable) {
              variable.properties[lastProp] = {
                id: lastProp,
                isCallable,
                callable: isCallable ? props.st : null,
                isImport: false,
                declarationSt: props.st,
                hash: hash(props.st),
                properties: {}
              }
            }
          }
        }
      }
      break
    default:
    // console.debug(`Found ${props.st.type}, skipping...`)
  }
}

export function registerHoisted(props: RegisterProps): void {
  walker.simple(
    props.st,
    {
      VariableDeclaration: node => {
        if (node.kind === 'var') {
          const isCallable =
            (node.init &&
              (node.init.type === 'FunctionExpression' ||
                node.init.type === 'ArrowFunctionExpression' ||
                node.init.type === 'ClassExpression')) ||
            false

          node.declarations.forEach(n =>
            props.scope.add({
              key: n.id.name,
              value: {
                id: n.id.name,
                hash: hash(node),
                isImport: false,
                isCallable,
                callable: isCallable ? node.init : null,
                declarationSt: node,
                properties: {}
              },
              declarator: Declarator.VAR
            })
          )
        }
      },
      FunctionDeclaration: node => {
        props.scope.add({
          key: node.id.name,
          value: {
            id: node.id.name,
            hash: hash(node),
            declarationSt: node,
            isImport: false,
            isCallable: true,
            callable: node,
            properties: {}
          }
        })
      }
    },
    sequentialVisitor
  )
}
