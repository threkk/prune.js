import { LinkProps } from './interfaces'
import { getPropertyChain } from '../visitor/expression'
import { Relationship } from '../call-graph'
import { sequentialVisitor } from '../visitor/statements'

const walker = require('acorn-walk')

export function linkPropsRead(props: LinkProps) {
  if (
    props.statement.type != null &&
    props.statement.type === 'ExpressionStatement'
  ) {
    const expr =
      props.statement.expression.type === 'AssignmentExpression'
        ? props.statement.expression.right
        : props.statement.expression

    walker.simple(
      expr,
      {
        MemberExpression(node: any) {
          const properties = getPropertyChain(node)
          const variable = props.scope.get(properties)
          if (variable) {
            const declaration = props.graph.getNode(variable.declarationSt)
            const current = props.graph.getNode(props.statement)
            props.graph.addEdge({
              src: current,
              dst: declaration,
              rel: Relationship.READ_PROP
            })
          }
        }
      },
      sequentialVisitor
    )
  }
}

export function linkPropsWrite(props: LinkProps) {
  if (
    props.statement.type != null &&
    props.statement.type === 'ExpressionStatement' &&
    props.statement.expression.type === 'AssignmentExpression' &&
    props.statement.expression.left.type === 'MemberExpression'
  ) {
    const { left } = props.statement.expression

    const [obj, ...properties] = getPropertyChain(left)

    const baseScope = props.scope.get(obj)
    if (!baseScope) return

    const variable = properties.reduce((prev, curr) => {
      if (prev === null) return null
      return prev.properties[curr] || null
    }, baseScope)

    if (!variable) return

    const declaration = props.graph.getNode(variable.declarationSt)
    const current = props.graph.getNode(props.statement)

    props.graph.addEdge({
      src: current,
      dst: declaration,
      rel: Relationship.WRITE_PROP
    })
  }
}
