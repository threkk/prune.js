import { RegisterProps } from './interface'
import { Declarator } from '../scope'
import { sequentialVisitor } from '../visitor/statements'

const walker = require('acorn-walk')

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
                isImport: false,
                isExport: false,
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
            declarationSt: node,
            isImport: false,
            isExport: false,
            isCallable: true,
            callable: node,
            properties: {}
          }
        })
      },
      // https://stackoverflow.com/questions/29329662/are-es6-module-imports-hoisted
      ImportDeclaration: node => {
        const ids: string[] = props.st.specifiers.map(sp => sp.local.name)
        ids.forEach((id: string) =>
          props.scope.add({
            key: id,
            value: {
              id,
              isCallable: false,
              isImport: true,
              isExport: false,
              declarationSt: props.st,
              sourceModule: props.st.source.name,
              properties: {}
            }
          })
        )
      }
    },
    sequentialVisitor
  )
}
