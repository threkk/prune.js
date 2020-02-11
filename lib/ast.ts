import { readFileSync, PathLike } from 'fs'
import { analyze, ScopeManager } from 'eslint-scope'

import acorn from 'acorn'
import jsxParser = require('acorn-jsx')

export interface FileContent {
  path: PathLike
  content: string
}

export function loadFile(path: PathLike): FileContent {
  const content = readFileSync(path, 'utf-8')
  return { content, path }
}

/**
 * Generates a parser function with the given configuration. The parser will
 * take a path
 */
export function createScopeManager(
  jsx: boolean = false
): (path: FileContent) => ScopeManager {
  const options: acorn.Options = {
    sourceType: 'module', // Enables the import/export statements.
    ranges: true, // Add ranges to the nodes [node.start, node.end]
    ecmaVersion: 10,
    allowHashBang: true,
    locations: true
  }

  let parser = acorn.Parser
  if (jsx) {
    parser = parser.extend(jsxParser())
  }

  const parse: (file: FileContent) => ScopeManager = file => {
    const ast = parser.parse(file.content, {
      ...options,
      sourceFile: file.path as string
    })

    return analyze(ast, {
      ecmaVersion: 10, // Matching versions.
      ignoreEval: true // Could be enabled if considered.
    })
  }
  return parse
}
