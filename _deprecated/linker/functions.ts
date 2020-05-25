import { Relationship } from '../graph'
import { LinkProps } from './interfaces'
import { getPropertyChain } from '../visitor/expression'

export function linkCallExpression(props: LinkProps): void {
  if (props.statement?.expression?.type === 'CallExpression') {
    //
    // Callee
    //
    const callee = props.statement.expression.callee
    switch (callee.type) {
      case 'Identifier': {
        const id = callee.name
        console.log(`ID: ${id}`)
        const variable = props.scope.get(id)
        if (variable) {
          const declaration = props.graph.getNode(variable.declarationSt)
          const current = props.graph.getNode(props.statement)
          props.graph.addEdge({
            src: current,
            dst: declaration,
            rel: Relationship.CALL
          })
        }
        break
      }
      case 'MemberExpression': {
        const chain = getPropertyChain(callee)
        const variable = props.scope.get(chain)
        if (variable) {
          const declaration = props.graph.getNode(variable.declarationSt)
          const current = props.graph.getNode(props.statement)
          props.graph.addEdge({
            src: current,
            dst: declaration,
            rel: Relationship.CALL
          })
        }
        break
      }
      case 'FunctionExpression':
      default:
      // TODO: Not implemented yet.
    }

    //
    // Arguments
    //
    const args = props.statement.expression.arguments
    console.log('Args:', args)
  }
}