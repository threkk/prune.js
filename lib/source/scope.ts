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
  LET,
  FUNC,
  CLASS
}

export const UNDEFINED = Symbol('undefined')
export const NULL = Symbol('null')

export interface ScopeVariable {
  /** Variable name. */
  readonly id: string
  /** If the variable is an import/require. */
  readonly isImport: boolean
  /** Location of the node. */
  readonly loc: SourceLocation
  /** Declaration statement. */
  readonly declarationSt: Node
  /** In case it is a module, the path or name of it. */
  readonly sourceModule?: string
  /** Hash of the location to distinguish declarations with the same key. */
  readonly hash: string
  /** Properties of the variable in case it is an object. */
  properties: { [index: string]: ScopeVariable }
}

export interface ScopeSetter {
  key: string
  value: ScopeVariable
  declarator?: Declarator
}

export abstract class Scope {
  parent: Scope | null
  current: { [index: string]: ScopeVariable }

  get(key: string): ScopeVariable | null {
    const [base, ...properties] = key.split('.')

    if (!this.current[base]) {
      return this.parent.get(key) || null
    }

    const baseScope = this.current[base]
    if (properties.length === 0) {
      return baseScope
    }

    const value: ScopeVariable | null = properties.reduce(
      (prevVal: ScopeVariable | null, currKey: string) => {
        if (!prevVal) {
          return null
        }
        return prevVal.properties[currKey]
      },
      null
    )
    return value
  }

  getAll() {
    return {
      ...this.parent.getAll(),
      ...this.current
    }
  }

  abstract add(props: ScopeSetter): void
}

export class GlobalScope extends Scope {
  constructor() {
    super()
    this.parent = null
    this.current = {}
  }

  add(props: ScopeSetter) {
    this.current[props.key] = props.value
  }

  bootstrap() {
    // TODO
  }
}

export class BlockScope extends Scope {
  constructor(public parent: Scope) {
    super()
    this.current = {}
  }

  add(props: ScopeSetter): void {
    switch (props.declarator) {
      case Declarator.CONST:
      case Declarator.VAR:
      case Declarator.CLASS:
        this.current[props.key] = props.value
        break
      case Declarator.VAR:
      case Declarator.FUNC:
      default:
        this.parent.add(props)
        break
    }
  }
}

export class FunctionScope extends Scope {
  constructor(public parent: Scope) {
    super()
    this.current = {}
  }

  add(props: ScopeSetter): void {
    this.current[props.key] = props.value
  }

  bootstrap(st: acorn.Node): void {
    this.add({
      key: 'this',
      value: {
        id: 'this',
        isImport: false,
        loc: st.loc,
        declarationSt: st,
        hash: hash(st),
        properties: {}
      }
    })
    this.add({
      key: 'arguments',
      value: {
        id: 'arguments',
        isImport: false,
        loc: null,
        declarationSt: st,
        hash: hash(st),
        properties: {}
      }
    })
  }
}
