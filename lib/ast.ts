import { readFileSync, PathLike } from 'fs'
import * as escope from 'eslint-scope'
import * as estree from 'estree'
import * as espree from 'espree'
import hash from './util/hash'

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

export type StatementType =
  | estree.Statement
  | estree.Declaration
  | estree.Program

export function isStatementType(node: estree.Node): node is StatementType {
  return /Statement|Declaration/.test(node.type) || node.type === 'Program'
}

export class ASTManager {
  #path: PathLike
  ast: estree.Node
  sm: escope.ScopeManager
  #idSt: IdentifierTracker

  constructor(path: PathLike, jsx: boolean = false) {
    this.#path = path
    this.#idSt = new IdentifierTracker()

    const content: string = readFileSync(this.#path, 'utf-8')
    const options: espree.Options = {
      sourceType: 'module', // Enables the import/export statements.
      loc: true, // Enables locations.
      range: true, // Add ranges to the nodes [node.start, node.end]
      ecmaVersion: 10,
      allowHashBang: true,
      locations: true,
      ecmaFeatures: {
        jsx,
        globalReturn: true
      }
    }

    this.ast = espree.parse(content, options)

    this.sm = escope.analyze(this.ast, {
      ecmaVersion: 10, // Matching versions.
      ignoreEval: true, // Could be enabled if considered.
      sourceType: 'module' // ES6 support
    })
  }

  trackNode(props: IdContext) {
    this.#idSt.add(props)
  }

  // TODO: Testing
  lookupStatement(identifier: estree.Identifier): StatementType | null {
    return this.#idSt.getContext(identifier)?.st ?? null
  }

  // TODO: Testing
  lookupDeclarationStatament(
    identifier: estree.Identifier
  ): StatementType | null {
    // const hashId = hash(identifier)
    const ctx = this.#idSt.getContext(identifier)

    for (let ref of ctx.sc.references) {
      // const refId = hash((ref.identifier as any) as estree.Node)

      if (ref.identifier.name === identifier.name && ref.resolved) {
        const defs = ref.resolved.defs
        return defs[defs.length - 1].parent ?? defs[defs.length - 1].node
        // const lastDef = this.#idSt.getContext(
        //   (defs[defs.length - 1].name as any) as estree.Node
        // )
        // return lastDef?.st ?? null
      }
    }
    return null
  }
}

interface IdContext {
  id: estree.Identifier
  st: estree.Statement | estree.Declaration | estree.Program
  sc: escope.Scope
  isBuiltin?: boolean
}

class IdentifierTracker {
  #tracker: Map<string, IdContext> = new Map()

  add(props: IdContext): void {
    const { id, st, sc, isBuiltin } = props
    const key = hash(id)
    this.#tracker.set(key, { id, st, sc, isBuiltin: isBuiltin ?? false })
  }

  getContext(identifier: estree.Identifier): IdContext {
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

  hasIdentifier(identifier: estree.Node): boolean {
    const key = hash(identifier)
    return this.#tracker.has(key)
  }

  removeContext(identifier: estree.Node): void {
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
