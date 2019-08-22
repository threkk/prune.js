import { Relationship } from '../graph'
import { LinkProps } from './interfaces'

export function linkCallExpression(props: LinkProps): void {
  if (
    props.statement.type != null &&
    props.statement.type === 'CallExpression'
  ) {
    const caller = props.statement.callee
  }
}
