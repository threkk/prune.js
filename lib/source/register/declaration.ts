import { RegisterProps } from './interface'
import { Declarator, UNDEFINED } from '../scope'
import { hash } from '../call-graph'
import { blockVisitor } from '../visitor/blocks'
import { sequentialVisitor } from '../visitor/statements'
const walker = require('acorn-walk')

function registerFunctionDeclaration(props: RegisterProps): void {}

function registerVariableDeclaration(props: RegisterProps): void {}

function registerClassDeclaration(props: RegisterProps): void {}

export function registerDeclarations(props: RegisterProps): void {
  switch (props.st.type) {
    case 'FunctionDeclaration':
      registerFunctionDeclaration(props)
    case 'VariableDeclaration':
      registerVariableDeclaration(props)
    case 'ClassDeclaration':
    case 'ClassExpression':
      registerClassDeclaration(props)
    default:
      console.debug(`Found ${props.st.type}, skipping...`)
  }
}

export function registerHoisted(props: RegisterProps): void {
  walker.simple(
    props.st,
    {
      VariableDeclaration: node => {
        if (node.kind === 'var') {
          node.declarations.forEach(n =>
            props.scope.add({
              key: n.id.name,
              value: {
                id: n.id.name,
                loc: node.loc,
                hash: hash(node),
                isImport: false,
                value: UNDEFINED,
                declarationSt: node
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
            loc: node.loc,
            hash: hash(node),
            declarationSt: node,
            value: null,
            isImport: false
          }
        })
      }
    },
    sequentialVisitor
  )
}
