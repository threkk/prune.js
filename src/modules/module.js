const AST = require('../project/ast')
const {
  declarationParser,
  importParser,
  isValidExportNamedDeclaration,
  moduleExportParser
} = require('./utils')

/**
 * Defines the relevant information for handling modules: the path to the
 * module, the other modules it imports and if it exports something (what it
 * exports is irrelevant because we are not taking that into consideration in
 * this sections).
 */
class Module {
  /**
   * @constructor
   * @param {string} filePath - Path to the module.
   * @param {array} uses - Array containing the list of paths of other modules
   * it uses.
   * @param {boolean} isExported - If the module exports something or not.
   */
  constructor (filePath, uses, isExported) {
    this.filePath = filePath
    this.isExported = isExported
    this.uses = uses
  }
}

/**
 * Static function used to create modules.
 *
 * This function will generate the AST tree and look for the `require`
 * (CommonJS) function and `import` (ES6) keyword to determine which other
 * modules are used by the given module. It will also look for the
 * `module.exports` and `export` statements to determine if it export any of
 * its definitions.
 *
 * @param {string} filePath - Path to the module.
 * @param {boolean} withES7 - If the AST should be generated with ES7 support.
 * @param {boolean} withJSX - If the AST should be generated with JSX support.
 * @return {Module} Module based on the content of the file path.
 * @throws {Error} If the AST could not be generated.
 */
async function analyseFile (filePath, withES7, withJSX) {
  const parser = new AST(withES7, withJSX)
  const ast = await parser.build(filePath)
  const isValidBody =
      ast != null &&
      ast.program != null &&
      ast.program.body != null &&
      Array.isArray(ast.program.body)

  if (!isValidBody) {
    // debugger
    return new Module(filePath, [], false)
  }

  const uses = []
  let isExported = false

  // All the import/require nodes must be at the beginning of the file.
  for (let element of ast.program.body) {
    switch (element.type) {
      case 'VariableDeclaration':
        const req = declarationParser(element, filePath, withJSX)
        if (req != null) uses.push(req)
        break

      case 'ImportDeclaration':
        const imp = importParser(element, filePath, withJSX)
        if (imp != null) uses.push(imp)
        break

      case 'ExpressionStatement':
        isExported = isExported || moduleExportParser(element)
        break

      case 'ExportNamedDeclaration':
        if (!isValidExportNamedDeclaration(element)) {
          const file = element.loc.filename
          const start = element.loc.start
          const end = element.loc.end
          throw Error(`Invalid state detected at: ${file}:${start},${end}`)
        }

        isExported = true
        break
      case 'ExportDefaultDeclaration':
      case 'ExportAllDeclaration':
        isExported = true
        break
    }
  }
  return new Module(filePath, uses, isExported)
}

module.exports = {
  analyseFile,
  Module
}
