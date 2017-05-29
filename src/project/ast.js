const { parse } = require('babylon')
const fs = require('fs')

/**
 * Generates an AST of the given JavaScript file using the Babel compiler.
 */
class AST {
  /**
   * @constructor
   * @param {string} path - Path to the file.
   * @param {boolean} es7 - If the parser should enable `ES7` features.
   * @param {boolean} jsx - If the parser should enable `JSX`.
   */
  constructor (path, es7 = false, jsx = false) {
    this._path = path

    const plugins = []
    if (es7) plugins.push('*')
    if (jsx) plugins.push('jsx')

    this._options = {
      allowImportExportEverywhere: true, // Allows imports everywhere.
      sourceType: 'module', // Enables the import/export statements.
      ranges: true, // Add ranges to the nodes [node.start, node.end]
      plugins
    }
    this._ast = this._buildAst()
  }

  /** @return {Object} AST tree of the file. */
  get ast () {
    return this._ast
  }

  /** @return {string} Path to the file */
  get path () {
    return this._path
  }

  /**
   * Reads the file and executes the parser.
   *
   * @private
   * @return {Object} AST tree of the file.
   */
  _buildAst () {
    const file = fs.readFileSync(this._path, 'utf-8')
    return parse(file, this._options)
  }
}

module.exports = AST
