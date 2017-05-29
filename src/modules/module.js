const { dirname, extname, isAbsolute, resolve } = require('path')
const { existsSync } = require('fs')

const AST = require('../project/ast')

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
    this._filePath = filePath
    this._isExported = isExported
    this._uses = uses
  }

  /** @return {string} Path to the module. */
  get filePath () {
    return this._filePath
  }

  /** @return {boolean} If the module exports something or not */
  get isExported () {
    return this._isExported
  }

  /** @return {array} List of paths that the module uses. */
  get uses () {
    return this._uses
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
   * @static
   * @param {string} filePath - Path to the module.
   * @param {boolean} withES7 - If the AST should be generated with ES7 support.
   * @param {boolean} withJSX - If the AST should be generated with JSX support.
   * @return {Module} Module based on the content of the file path.
   * @throws {Error} If the AST could not be generated.
   */
  static create (filePath, withES7, withJSX) {
    const ast = new AST(filePath, withES7, withJSX)
    const isValidBody =
      ast != null &&
      ast.ast != null &&
      ast.ast.program != null &&
      ast.ast.program.body != null &&
      Array.isArray(ast.ast.program.body)

    if (isValidBody) {
      const uses = []
      let isExported = false

      for (let element of ast.ast.program.body) {
        switch (element.type) {
          case 'VariableDeclaration':
            const req = this._declarationParser(element, filePath, withJSX)
            if (req != null) uses.push(req)
            break

          case 'ImportDeclaration':
            const imp = this._importParser(element, filePath, withJSX)
            if (imp != null) uses.push(imp)
            break

          case 'ExpressionStatement':
            const isModuleExportExpr =
              element.expression != null &&
              element.expression.type === 'AssignmentExpression' &&
              element.expression.left != null &&
              element.expression.left.type === 'MemberExpression' &&
              element.expression.left.object != null &&
              element.expression.left.object.type === 'Identifier' &&
              element.expression.left.object.name === 'module' &&
              element.expression.left.property.type === 'Identifier' &&
              element.expression.left.property.name === 'exports'

            isExported = isExported || isModuleExportExpr
            break

          case 'ExportNamedDeclaration':
            const isNotNullDeclaration = element.declaration != null
            const isNotNullSource = element.source != null
            const isNotEmptySpecifier =
              element.specifiers != null &&
              Array.isArray(element.specifiers) &&
              element.specifiers.length > 0

            if (isNotNullDeclaration && (isNotNullSource || isNotEmptySpecifier)) {
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
  }

  /**
   * Given a `VariableDeclaration`, it checks if it fulfills the
   * [specifications](http://wiki.commonjs.org/wiki/Modules/1.1)  of a
   * `require` call. Sadly, this implementation has two issues:
   *
   * - Due to the dynamic nature of JavaScript, we cannot check using static
   *   analysis if the parameter of the require function is a `string` unless it
   *   is a `StringLiteral`. This issue has no good solution.
   *
   * - If the `require` function is assigned to a different variable, and that
   *   variable used to import the modules, it is not tracked.
   *
   * @static
   * @private
   * @param {Object} decl - AST node with type `VariableDeclaration`.
   * @param {string} filePath - Path to the root of the project.
   * @param {boolean} withJSX - If we should allow `.jsx` extensions.
   * @return {string} Path to the module declared in the require. `null` if it
   * is not a valid `require`.
   */
  static _declarationParser (decl, filePath, withJSX) {
    // Maybe we want to go back to the for statement, but it seems it is only
    // for AMD modules. This checks that it is a function called require that
    // accepts only one parameter.
    const isRequire =
      Array.isArray(decl.declarations) &&
      decl.declarations.length === 1 &&
      decl.declarations[0].init != null &&
      decl.declarations[0].init.callee != null &&
      decl.declarations[0].init.arguments != null &&
      decl.declarations[0].init.callee.name != null &&
      decl.declarations[0].init.callee.name === 'require' &&
      decl.declarations[0].init.arguments != null &&
      Array.isArray(decl.declarations[0].init.arguments) &&
      decl.declarations[0].init.arguments.length === 1

    const isRequireWithStr =
      isRequire &&
      decl.declarations[0].init.arguments[0].type === 'StringLiteral' &&
      decl.declarations[0].init.arguments[0].value != null

    if (isRequireWithStr) {
      const param = decl.declarations[0].init.arguments[0].value
      return this._extractPath(param, filePath, withJSX)
    }

    return null
  }

  /**
   * Given a `ImportDeclaration`, it extracts the path to the imported module.
   * In case the path is not valid, it will return null.
   *
   * @param {Object} element - AST node object with type `ImportDeclaration`.
   * @param {string} filePath - Path to the root of the project.
   * @param {boolean} withJSX - If we should allow `.jsx` extensions.
   * @return {string} Path to the module declared in the require. `null` if it
   * is not a valid `require`.
   */
  static _importParser (element, filePath, withJSX) {
    const isValidImport =
      element.source != null &&
      element.source.type === 'StringLiteral' &&
      element.source.value != null

    if (isValidImport) {
      const param = element.source.value
      return this._extractPath(param, filePath, withJSX)
    }

    return null
  }

  /**
   * Given a relative path as a string and the root of the project, resolves the
   * path to the module. In case it does not exist, it returns null.
   *
   * @param {string} value - Path to resolve.
   * @param {string} filePath - Path to the root of the project.
   * @param {boolean} withJSX - If we should allow `.jsx` extensions.
   * @return {string} Path to the module. Null if not found.
   */
  static _extractPath (value, filePath, withJSX) {
    const isAbsOrRel = (p) => ['.', '/'].includes(p.charAt(0))

    if (isAbsOrRel(value)) {
      let modulePath = value

      if (!isAbsolute(value)) {
        modulePath = resolve(dirname(filePath), value)
      }

      if (existsSync(modulePath)) {
        return modulePath
      } else if (extname(modulePath) === '') {
        if (existsSync(`${modulePath}.js`)) {
          return `${modulePath}.js`
        } else if (withJSX && existsSync(`${modulePath}.jsx`)) {
          return `${modulePath}.jsx`
        }
      }
    }
    return null
  }
}

module.exports = Module
