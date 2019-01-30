const fs = require('fs')
const { promisify } = require('util')
const acorn = require('acorn')
const jsxParser = require('acorn-jsx')

const readFile = promisify(fs.readFile)

/**
 * Generates a parser function with the given configuration. The parser will
 * take a path
 *
 * @param {boolean} jsx - If the parser should enable `JSX`.
 * @return {Function} Parse function
 */
function createASTParser (jsx = false) {
  const options = {
    sourceType: 'module', // Enables the import/export statements.
    ranges: true, // Add ranges to the nodes [node.start, node.end]
    tokens: false, // Disables token listing.
    ecmaVersion: 10,
    allowHashBang: true,
    sourceFile: true
  }

  let parser = acorn
  if (jsx) {
    parser = acorn.Parser.extend(jsxParser)
  }

  return async (path) => {
    const file = await readFile(path, 'utf-8')
    return parser.parse(file, options)
  }
}

module.exports = createASTParser
