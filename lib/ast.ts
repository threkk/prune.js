import * as acorn from 'acorn'
import { readFile, PathLike } from 'fs'
import { promisify } from 'util'

const jsxParser = require('acorn-jsx')
const rf = promisify(readFile)

export interface FileContent {
  path: PathLike
  content: string
}

export async function loadFile(path: PathLike): Promise<FileContent> {
  const content = await rf(path, 'utf-8')
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
