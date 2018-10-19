const createASTParser = require('../project/ast')
const traverse = require('babel-traverse').default
const { extractPath } = require('./utils')

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
  const parser = createASTParser(withES7, withJSX)
  const ast = parser(filePath)

  const uses = []
  let isExported = false

  const visitor = {
    // Given a `VariableDeclaration`, it checks if it fulfills the
    // [specifications](http://wiki.commonjs.org/wiki/Modules/1.1)  of a
    // `require` call. Sadly, this implementation has two issues:
    // - Due to the dynamic nature of JavaScript, we cannot check using static
    //   analysis if the parameter of the require function is a `string` unless it
    //   is a `StringLiteral`. This issue has no good solution.
    // - If the `require` function is assigned to a different variable, and that
    //   variable used to import the modules, it is not tracked.
    VariableDeclaration (path) {
      const declarations = path.get('declarations')
      for (const declaration of declarations) {
        if (declaration.isVariableDeclarator()) {
          const init = declaration.get('init')

          if (init.isCallExpression()) {
            const callee = init.get('callee')
            const args = init.get('arguments')

            if (callee.isExpression({ name: 'require' }) &&
              args.length === 1 && args[0].isLiteral()) {
              const arg = args[0].node.value
              const req = extractPath(arg, filePath, withJSX)
              if (req != null) uses.push(req)
            }
          }
        }
      }
    },
    ImportDeclaration (path) {
      const source = path.get('source')

      if (source.isStringLiteral()) {
        const value = source.node.value
        const imp = extractPath(value, filePath, withJSX)
        if (imp != null) uses.push(imp)
      }
    },
    ExpressionStatement (path) {
      const expression = path.get('expression')
      if (expression.isAssignmentExpression()) {
        const operator = expression.get('operator')
        const left = expression.get('left')
        if (operator.node === '=' && left.isMemberExpression()) {
          if (left.get('object').isIdentifier({ name: 'module' }) &&
            left.get('property').isIdentifier({ name: 'exports' })) {
            isExported = true
          }
        }
      }
    },
    ExportNamedDeclaration (path) {
      isExported = true
    },
    ExportDefaultDeclaration (path) {
      isExported = true
    },
    ExportAllDeclaration (path) {
      isExported = true
    }
  }

  traverse(ast, visitor)

  return new Module(filePath, uses, isExported)
}

module.exports = {
  analyseFile,
  Module
}
