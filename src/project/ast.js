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

    const options = {
      allowImportExportEverywhere: true, // Allows imports everywhere.
      sourceType: 'module', // Enables the import/export statements.
      ranges: true, // Add ranges to the nodes [node.start, node.end]
      plugins
    }

    const file = fs.readFileSync(this._path, 'utf-8')
    this._ast = parse(file, options)
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
   * @return {array} Returns an array containing the nodes from the body. Empty
   * if invalid.
   **/
  get body () {
    if (this._ast != null &&
      this._ast.program != null &&
      this._ast.program.sourceType === 'module' &&
      Array.isArray(this._ast.program.body)
    ) {
      return this._ast.program.body
    }
    return []
  }
}

module.exports = AST
