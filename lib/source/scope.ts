/**
 * The BodyScope defines the variables available in current body scope. This
 * body scope can be a function scope or a block scope depending on the node.
 * This is relvant given that the behaviour changes depending if it is a
 * function or a block.
 *
 * If it is a function scope:
 * - The previous local variables are now considered global.
 * - The local and block environment are clear.
 * - Variables declared with var are local and hoisted.
 *
 * If it is a block scope:
 * - The previous local variables are still local.
 * - The previous block variable are now local, block environment is clear.
 *  - Variables declared with var are global and hoisted.
 */

import { Node, SourceLocation } from 'acorn'

interface ScopeVariable {
  readonly name: string
  readonly kind: string
  readonly node: Node
  readonly isImport: boolean
  readonly loc: SourceLocation
  readonly type: string
  value?: string
  mod?: string
}

export interface ScopeProps {
  glob: { [index: string]: ScopeVariable }
  local: { [index: string]: ScopeVariable }
  block: { [index: string]: ScopeVariable }
  self: { [index: string]: ScopeVariable }
}

abstract class Scope {
  glob: { [index: string]: ScopeVariable }
  local: { [index: string]: ScopeVariable }
  block: { [index: string]: ScopeVariable }
  self: { [index: string]: ScopeVariable }

  populateScope(node: Node): void {}
}

export class BlockScope extends Scope {
  glob: { [index: string]: ScopeVariable }
  local: { [index: string]: ScopeVariable }
  block: { [index: string]: ScopeVariable }
  self: { [index: string]: ScopeVariable }

  constructor(props: ScopeProps) {
    super()
    this.glob = { ...props.glob }
    this.local = { ...props.local, ...props.block }
    this.block = {}
    this.self = { ...props.self }
  }
}

export class FunctionScope extends Scope {
  glob: { [index: string]: ScopeVariable }
  local: { [index: string]: ScopeVariable }
  block: { [index: string]: ScopeVariable }
  self: { [index: string]: ScopeVariable }

  constructor(props: ScopeProps) {
    super()
    this.glob = { ...props.glob, ...props.local }
    this.local = {}
    this.block = {}
    this.self = {}
  }
}
