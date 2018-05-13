const fs = require('fs')
const { promisify } = require('util')
const { parse } = require('babylon')

const readFile = promisify(fs.readFile)

/**
 * Generates an AST of the given JavaScript file using the Babel compiler.
 */
class ASTParser {
  /**
   * @constructor
   * @param {boolean} es7 - If the parser should enable `ES7` features.
   * @param {boolean} jsx - If the parser should enable `JSX`.
   */
  constructor (es7 = false, jsx = false) {
    const plugins = []
    if (jsx) plugins.push('jsx')
    if (es7) {
      plugins.push('estree')
      plugins.push('doExpressions')
      plugins.push('decorators')
    }

    this.options = {
      sourceType: 'module', // Enables the import/export statements.
      ranges: true, // Add ranges to the nodes [node.start, node.end]
      tokens: false, // Disables token listing.
      plugins
    }
  }

  /**
   * Reads the file and executes the parser.
   *
   * @return {Promise} AST tree of the file.
   * @throws TypeError Error if invalid AST.
   */
  async build (path) {
    const file = await readFile(path, 'utf-8')
    return parse(file, this.options)
  }
}

module.exports = ASTParser
