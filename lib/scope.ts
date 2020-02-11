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
import { Node } from 'acorn'

export enum Declarator {
  VAR,
  CONST,
  LET,
  FUNC,
  ARROW,
  CLASS
}

export const UNDEFINED = Symbol('undefined')
export const NULL = Symbol('null')

export interface ScopeVariable {
  /** Variable name. */
  readonly id: string
  /** If the variable is an import/require. */
  readonly isImport: boolean
  /** Declaration statement. */
  readonly declarationSt: Node
  /** In case it is a module, the path or name of it. */
  readonly sourceModule?: string
  /** If the variable has properties (object, function or class). */
  hasProperties: boolean
  /** Properties of the variable in case it is an object. */
  properties: { [index: string]: ScopeVariable }
  /** If the value is callable. */
  isCallable: boolean
  /** Callable node. */
  callable?: Node
  /** If the variable is an export/module.exports. */
  isExport: boolean
  /** Export name. */
  exportName?: string
}

export interface ScopeSetter {
  key: string
  value: ScopeVariable
  declarator?: Declarator
}

export abstract class Scope {
  parent: Scope | null
  current: { [index: string]: ScopeVariable }

  get(key: string | string[]): ScopeVariable | null {
    let base: string
    let properties: string[]
    if (Array.isArray(key)) [base, ...properties] = key
    else (key as string).split('.')

    if (!this.current[base]) {
      return this.parent.get(key) || null
    }

    const baseScope = this.current[base]
    if (properties.length === 0) {
      return baseScope
    }

    const value: ScopeVariable | null = properties.reduce(
      (prevVal: ScopeVariable | null, currKey: string) => {
        if (!prevVal) return null
        if (currKey === 'prototype') return prevVal

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
    this.current = {
      require: {
        id: 'require',
        declarationSt: null,
        isImport: false,
        isCallable: true,
        callable: null,
        properties: null,
        isExport: false,
        hasProperties: false
      }
    }
  }

  add(props: ScopeSetter) {
    this.current[props.key] = props.value
  }

  get(key: string): ScopeVariable | null {
    return this.current[key] || null
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
}
