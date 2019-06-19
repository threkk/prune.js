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
import { hash } from './call-graph'

export enum Declarator {
  VAR,
  CONST,
  LET
}

export interface ScopeVariable {
  /** Variable name. */
  readonly name: string
  /** Variable type. */
  readonly type: Declarator
  /** Node. */
  readonly node: Node
  /** Node hash. */
  readonly hash: string
  /** If the variable is an import/require. */
  readonly isImport: boolean
  /** Location of the node. */
  readonly loc: SourceLocation
  /** Statement node. */
  readonly stat: Node
  /** In case it is a module, the path or name of it. */
  readonly sourceModule?: string
  /** Value guess in case it is a literal or similar. */
  value?: string
  /** Properties of the variable in case it is an object. */
  properites?: { [key: string]: ScopeVariable }
}

export interface ScopeProps {
  glob: { [index: string]: ScopeVariable }
  func: { [index: string]: ScopeVariable }
  block: { [index: string]: ScopeVariable }
}

export abstract class Scope {
  glob: { [index: string]: ScopeVariable }
  func: { [index: string]: ScopeVariable }
  block: { [index: string]: ScopeVariable }
  self: { [index: string]: ScopeVariable }

  get(key: string, self: boolean = false): ScopeVariable | null {
    if (self) {
      const value = this.self[key]
      if (value) {
        return value
      }
      return null
    }

    return this.block[key] || this.func[key] || this.glob[key] || null
  }

  getAll() {
    return {
      ...this.glob,
      ...this.func,
      ...this.block,
      ...this.self
    }
  }

  set(key: string, value: ScopeVariable, declarator?: Declarator): void {
    switch (declarator) {
      case Declarator.CONST:
      case Declarator.VAR:
        this.block[key] = value
        break
      case Declarator.VAR:
      default:
        this.func[key] = value
        break
    }
  }
}

export class BlockScope extends Scope {
  glob: { [index: string]: ScopeVariable }
  func: { [index: string]: ScopeVariable }
  block: { [index: string]: ScopeVariable }

  constructor(props?: ScopeProps) {
    super()

    this.glob = props ? { ...props.glob } : {}
    this.func = props ? { ...props.func, ...props.block } : {}
    this.block = {}
  }
}

export class FunctionScope extends Scope {
  glob: { [index: string]: ScopeVariable }
  func: { [index: string]: ScopeVariable }
  block: { [index: string]: ScopeVariable }

  constructor(props?: ScopeProps) {
    super()
    this.glob = props ? { ...props.glob, ...props.func } : {}
    this.func = {}
    this.block = {}
  }

  bootstrap(decl: acorn.Node, st: acorn.Node): void {
    const self: ScopeVariable = {
      name: 'this',
      type: Declarator.VAR,
      node: decl,
      hash: hash(decl),
      isImport: false,
      loc: decl.loc,
      stat: st
    }
    const args: ScopeVariable = {
      name: 'arguments',
      type: Declarator.VAR,
      node: null,
      hash: null,
      isImport: false,
      loc: null,
      stat: st
    }
    this.func = { this: self, arguments: args }
  }
}
