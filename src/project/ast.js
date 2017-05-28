const { parse } = require('babylon')
const fs = require('fs')

class AST {
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

  get ast () {
    return this._ast
  }

  get path () {
    return this._path
  }

  _buildAst () {
    const file = fs.readFileSync(this._path, 'utf-8')
    return parse(file, this._options)
  }
}

module.exports = AST
