import {Node} from 'acorn'
const walker = require('acorn-walk')

type VisitorFunc = (node: Node, state: any) => void

export function visitStatement(ast: Node, visitors: VisitorFunc[]): void {
  visitors.forEach(visitor => walker.simple(ast, visitor))
}
