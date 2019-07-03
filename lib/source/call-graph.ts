import { Node } from 'acorn'
import { createHash, Hash } from 'crypto'
import { Scope } from '../source/scope'
import { GEdge, GNode } from '../util/graph'

export enum Relationship {
  PREVIOUS = 'PREVIOUS', // Destination is the previous node of source.
  NEXT = 'NEXT', // Destionation is the next node of source.
  CALLE = 'CALLEE', // Source calling destination.
  CALLED = 'CALLED', // Source is called by destination.
  PROP = 'PROP', // Porperty of source.
  MEMBER = 'MEMBER', // Child of source.
  RETURN = 'RETURN', // Destionation is return of the source.
  RESULT = 'RESULT', // Destination is the result of the source.
  ARG = 'ARG', // Source is argument, equivalent to dst.
  PARAM = 'PARAM' // Dst is a parameter equivalent to source
}

export class StatementNode implements GNode {
  public id: string
  constructor(public node: Node, public scope: Scope) {
    this.id = hash(node)
  }
}

export class Relation implements GEdge {
  constructor(public src: GNode, public dst: GNode, public rel: Relationship) {}
}

export function hash(node: Node): string {
  const hasher: Hash = createHash('md5')
  const { type, loc } = node
  const input = JSON.stringify({ type, loc })

  hasher.update(input)
  return hasher.digest('base64')
}
