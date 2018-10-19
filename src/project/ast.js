const fs = require('fs')
const { promisify } = require('util')
const { parse } = require('@babel/parser')

const readFile = promisify(fs.readFile)

/**
 * Generates a parser function with the given configuration. The parser will
 * take a path
 *
 * @param {boolean} es7 - If the parser should enable `ES7` features.
 * @param {boolean} jsx - If the parser should enable `JSX`.
 * @return {Function} Parse function
 */
function createASTParser (es7 = false, jsx = false) {
  const plugins = []
  if (jsx) plugins.push('jsx')
  if (es7) {
    plugins.push('estree')
    plugins.push('doExpressions')
    plugins.push('decorators')
  }

  const options = {
    sourceType: 'module', // Enables the import/export statements.
    ranges: true, // Add ranges to the nodes [node.start, node.end]
    tokens: false, // Disables token listing.
    plugins
  }

  return async (path) => {
    const file = await readFile(path, 'utf-8')
    return parse(file, options)
  }
}

module.exports = createASTParser
