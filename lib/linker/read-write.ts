import { Relationship } from '../graph'
import { findIdentifiers } from '../visitor/expression'
import { LinkProps } from './interfaces'

export function linkVarRead(props: LinkProps) {
  if (
    props.statement.type != null &&
    props.statement.type === 'ExpressionStatement'
  ) {
    const possibleIds = findIdentifiers(props.statement.expression, 'left')
    possibleIds.forEach((id: string) => {
      const variable = props.scope.get(id)
      if (variable) {
        const declaration = props.graph.getNode(variable.declarationSt)
        const current = props.graph.getNode(props.statement)
        props.graph.addEdge({
          src: current,
          dst: declaration,
          rel: Relationship.READ
        })
      }
    })
  }
}

export function linkVarWrite(props: LinkProps) {
  // We only want the left part of the assignment expression.
  // This is for only expressions of type a = b
  if (
    props.statement.type != null &&
    props.statement.type === 'ExpressionStatement' &&
    props.statement.expression.type === 'AssignmentExpression' &&
    props.statement.expression.left.type === 'Identifier'
  ) {
    const { left } = props.statement.expression
    findIdentifiers(left).forEach((id: string) => {
      const variable = props.scope.get(id)

      if (!variable) return
      const declaration = props.graph.getNode(variable.declarationSt)
      const current = props.graph.getNode(props.statement)

      props.graph.addEdge({
        src: current,
        dst: declaration,
        rel: Relationship.WRITE
      })
    })
  }
}
