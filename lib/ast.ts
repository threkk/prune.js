import * as acorn from 'acorn'
import { readFileSync, PathLike } from 'fs'

const jsxParser = require('acorn-jsx')

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
export function createASTParser(
  jsx: boolean = false
): (path: FileContent) => acorn.Node {
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

  const parse: (file: FileContent) => acorn.Node = file => {
    return parser.parse(file.content, {
      ...options,
      sourceFile: <string>file.path
    })
  }
  return parse
}
