import acorn from 'acorn'
import jsxParser from 'acorn-jsx'
import fs, { PathLike } from 'fs'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)

/**
 * Generates a parser function with the given configuration. The parser will
 * take a path
 */
export default function createASTParser(
  jsx: boolean = false
): (path: PathLike) => Promise<acorn.Node> {
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

  const parse: (path: PathLike) => Promise<acorn.Node> = async path => {
    const file = await readFile(path, 'utf-8')
    return parser.parse(file, { ...options, sourceFile: file })
  }
  return parse
}
