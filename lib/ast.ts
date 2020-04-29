import { readFileSync, PathLike } from 'fs'
import { analyze, ScopeManager } from 'eslint-scope'

import { hash } from './graph'
import { Parser, Node, Options } from 'acorn'
import jsxParser = require('acorn-jsx')

export interface FileContent {
  path: PathLike
  content: string
}

export class ASTManager {
  #path: PathLike
  #ast: Node
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

    this.#ast = parser.parse(content, {
      ...options,
      sourceFile: this.#path as string
    })

    this.sm = analyze(this.#ast, {
      ecmaVersion: 10, // Matching versions.
      ignoreEval: true, // Could be enabled if considered.
      sourceType: 'module' // ES6 support
    })
  }

  trackNode(props: IdStPair) {
    this.#idSt.add(props)
  }

  // TODO: Testing
  lookupStatement(identifier: Node): Node | null {
    return this.#idSt.getStatement(identifier)?.st ?? null
  }

  // TODO: Testing
  lookupDeclarationStatament(identifier: Node): Node | null {
    const idScp = this.sm.acquire(identifier)
    const hashId = hash(identifier)

    for (let ref of idScp.references) {
      const refId = hash((ref.identifier as any) as Node)

      if (refId === hashId && ref.resolved) {
        const defs = ref.resolved.defs
        return (
          this.#idSt.getStatement((defs[defs.length - 1].name as any) as Node)
            ?.st ?? null
        )
      }
    }
    return null
  }

  // TODO: testing
  lookUpLastWriteStatement(identifier: Node): Node | null {
    const idScp = this.sm.acquire(identifier)
    const hashId = hash(identifier)

    for (let ref of idScp.references) {
      const refId = hash((ref.identifier as any) as Node)

      if (refId === hashId && ref.resolved) {
        const refs = ref.resolved.references
        for (let i = refs.length; i > 0; i--) {
          if (refs[i].isWrite() || refs[i].isReadWrite()) {
            return (
              this.#idSt.getStatement((refs[i].identifier as any) as Node)
                ?.st ?? null
            )
          }
        }
      }
    }
    return null
  }
}

interface IdStPair {
  id: Node
  st: Node
}

class IdentifierTracker {
  #tracker: Map<string, IdStPair> = new Map()

  add(props: IdStPair): void {
    const { id, st } = props
    if (id.type !== 'Identifier') {
      throw new Error(`props.id is not an Identifier. Got: ${id.type}`)
    }

    if (!/Statement|Declaration/.test(st.type)) {
      throw new Error(`props.st is not a Statement. Got: ${st.type}`)
    }

    const key = hash(id)
    this.#tracker.set(key, props)
  }

  getStatement(identifier: Node): IdStPair {
    const key = hash(identifier)
    return this.#tracker.get(key)
  }

  getAllPairs(): IdStPair[] {
    return [...this.#tracker.values()]
  }

  hasIdentifier(identifier: Node): boolean {
    const key = hash(identifier)
    return this.#tracker.has(key)
  }

  removePair(identifier: Node): void {
    const key = hash(identifier)
    if (this.#tracker.has(key)) this.#tracker.delete(key)
  }

  keys(): string[] {
    return [...this.#tracker.keys()]
  }
}
