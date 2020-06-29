import { readFileSync, PathLike } from 'fs'
import { ScopeManager, Scope, analyze } from 'eslint-scope'
import { Statement, Declaration, Program, Identifier, Node } from 'estree'

// @ts-ignore TS7016
import { Options, parse } from 'espree'

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

export type StatementType = Statement | Declaration | Program

export function isStatementType(node: Node): node is StatementType {
  return /Statement|Declaration/.test(node.type) || node.type === 'Program'
}

export class ASTManager {
  #path: PathLike
  ast: Node
  sm: ScopeManager

  constructor(path: PathLike, jsx: boolean = false) {
    this.#path = path

    const content: string = readFileSync(this.#path, 'utf-8')
    const options: Options = {
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

    this.ast = parse(content, options)

    this.sm = analyze(this.ast, {
      ecmaVersion: 10, // Matching versions.
      ignoreEval: true, // Could be enabled if considered.
      sourceType: 'module' // ES6 support
    })
  }
}
