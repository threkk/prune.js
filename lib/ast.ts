import { readFileSync, PathLike } from 'fs'
import { analyze, ScopeManager, Scope } from 'eslint-scope'

import { hash, StatementNode } from './graph'
import { Parser, Node, Options } from 'acorn'
import jsxParser = require('acorn-jsx')

export interface FileContent {
  path: PathLike
  content: string
}

export enum VariableTypes {
  CATCH_CLAUSE = 'CatchClause',
  PARAMETER = 'Parameter',
  FUNCTION_NAME = 'FunctionName',
  CLASS_NAME = 'ClassName',
  VARIABLE = 'Variable',
  IMPORT_BINDING = 'ImportBinding',
  TDZ = 'TDZ',
  IMPLICIT_GLOBAL = 'ImplicitGlobalVariable'
}

export class ASTManager {
  #path: PathLike
  ast: Node
  sm: ScopeManager
  #idSt: IdentifierTracker

  constructor(path: PathLike, jsx: boolean = false) {
    this.#path = path
    this.#idSt = new IdentifierTracker()

    const content: string = readFileSync(this.#path, 'utf-8')
    const options: Options = {
      sourceType: 'module', // Enables the import/export statements.
      ranges: true, // Add ranges to the nodes [node.start, node.end]
      ecmaVersion: 10,
      allowHashBang: true,
      locations: true
    }

    let parser = Parser
    if (jsx) {
      parser = parser.extend(jsxParser())
    }

    this.ast = parser.parse(content, {
      ...options,
      sourceFile: this.#path as string
    })

    this.sm = analyze(this.ast, {
      ecmaVersion: 10, // Matching versions.
      ignoreEval: true, // Could be enabled if considered.
      sourceType: 'module' // ES6 support
    })
  }

  trackNode(props: IdContext) {
    this.#idSt.add(props)
  }

  // TODO: Testing
  lookupStatement(identifier: Node): Node {
    return this.#idSt.getContext(identifier)?.st ?? null
  }

  // TODO: Testing
  lookupDeclarationStatament(identifier: Node): Node | null {
    // const hashId = hash(identifier)
    const ctx = this.#idSt.getContext(identifier)

    for (let ref of ctx.sc.references) {
      // const refId = hash((ref.identifier as any) as Node)

      if (ref.identifier.name === (identifier as any).name && ref.resolved) {
        const defs = ref.resolved.defs
        return defs[defs.length - 1].parent ?? defs[defs.length - 1].node
        // const lastDef = this.#idSt.getContext(
        //   (defs[defs.length - 1].name as any) as Node
        // )
        // return lastDef?.st ?? null
      }
    }
    return null
  }

  // TODO: testing
  lookUpLastWriteStatement(identifier: Node): Node | null {
    const hashId = hash(identifier)
    const ctx = this.#idSt.getContext(identifier)

    for (let ref of ctx.sc.references) {
      const refId = hash((ref.identifier as any) as Node)

      if (refId === hashId && ref.resolved) {
        const refs = ref.resolved.references
        for (let i = refs.length - 1; i > 0; i--) {
          if (refs[i].isWrite() || refs[i].isReadWrite()) {
            return (
              this.#idSt.getContext((refs[i].identifier as any) as Node)?.st ??
              null
            )
          }
        }
      }
    }
    return null
  }
}

interface IdContext {
  id: Node
  st: Node
  sc: Scope
  isBuiltin?: boolean
}

class IdentifierTracker {
  #tracker: Map<string, IdContext> = new Map()

  add(props: IdContext): void {
    const { id, st, sc, isBuiltin } = props
    if (id.type !== 'Identifier') {
      throw new Error(`props.id is not an Identifier. Got: ${id.type}`)
    }

    if (!/Statement|Declaration/.test(st.type)) {
      throw new Error(`props.st is not a Statement. Got: ${st.type}`)
    }

    const key = hash(id)
    this.#tracker.set(key, { id, st, sc, isBuiltin: isBuiltin ?? false })
  }

  getContext(identifier: Node): IdContext {
    let key = hash(identifier)
    if (!this.#tracker.has(key)) {
      const noLoc = { ...identifier, loc: null }
      key = hash(noLoc)
    }
    return this.#tracker.get(key)
  }

  getAll(): IdContext[] {
    return [...this.#tracker.values()].filter(ctx => !ctx.isBuiltin)
  }

  hasIdentifier(identifier: Node): boolean {
    const key = hash(identifier)
    return this.#tracker.has(key)
  }

  removeContext(identifier: Node): void {
    const key = hash(identifier)
    if (this.#tracker.has(key) && !this.#tracker.get(key).isBuiltin)
      this.#tracker.delete(key)
  }

  keys(): string[] {
    return [...this.#tracker.entries()]
      .filter(([_, ctx]) => !ctx.isBuiltin)
      .map(([key, _]) => key)
  }
}
