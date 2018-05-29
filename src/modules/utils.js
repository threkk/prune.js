const { dirname, extname, isAbsolute, resolve } = require('path')
const { existsSync } = require('fs')

/**
 * Given a relative path as a string and the root of the project, resolves the
 * path to the module. In case it does not exist, it returns null.
 *
 * @param {string} value - Path to resolve.
 * @param {string} filePath - Path to the root of the project.
 * @param {boolean} withJSX - If we should allow `.jsx` extensions.
 * @return {string} Path to the module. Null if not found.
 */
function extractPath (value, filePath, withJSX = false) {
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
 * @param {Object} decl - AST node with type `VariableDeclaration`.
 * @param {string} filePath - Path to the root of the project.
 * @param {boolean} withJSX - If we should allow `.jsx` extensions.
 * @return {string} Path to the module declared in the require. `null` if it
 * is not a valid `require`.
 */
function declarationParser (decl, filePath, withJSX) {
  // Maybe we want to go back to the for statement, but it seems it is only
  // for AMD modules. This checks that it is a function called require that
  // accepts only one parameter.
  const isRequire =
    Array.isArray(decl.declarations) &&
    decl.declarations.length === 1 &&
    decl.declarations[0].init != null &&
    decl.declarations[0].init.callee != null &&
    decl.declarations[0].init.callee.name != null &&
    decl.declarations[0].init.callee.name === 'require' &&
    decl.declarations[0].init.arguments != null &&
    decl.declarations[0].init.arguments != null &&
    Array.isArray(decl.declarations[0].init.arguments) &&
    decl.declarations[0].init.arguments.length === 1

  const isRequireWithStr =
    isRequire &&
    decl.declarations[0].init.arguments[0].type === 'Literal' &&
    decl.declarations[0].init.arguments[0].value != null

  if (isRequireWithStr) {
    const param = decl.declarations[0].init.arguments[0].value
    return extractPath(param, filePath, withJSX)
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
function importParser (element, filePath, withJSX) {
  const isValidImport =
    element.source != null &&
    element.source.type === 'Literal' &&
    element.source.value != null

  if (isValidImport) {
    const param = element.source.value
    return extractPath(param, filePath, withJSX)
  }

  return null
}

/**
 * ExportNamedDeclaration can be found in an invalid state due to a combination
 * of properties. This function checks if it is in such configuration.
 *
 * From https://github.com/babel/babel/blob/master/packages/babel-parser/ast/spec.md#exportnameddeclaration
 * > Note: Having declaration populated with non-empty specifiers or non-null
 * > source results in an invalid state.
 *
 * @param {Object} element - AST node object with type `ImportDeclaration`.
 * @return Boolean true if valid.
 */
function isValidExportNamedDeclaration (element) {
  const isNotNullDeclaration = element.declaration != null
  const isNotNullSource = element.source != null
  const isNotEmptySpecifier =
    element.specifiers != null &&
    Array.isArray(element.specifiers) &&
    element.specifiers.length > 0

  return !(isNotNullDeclaration && (isNotNullSource || isNotEmptySpecifier))
}

/**
 *  Checks that the given assignment expression has on the left side a
 *  `module.exports` expression. This will mean that it is exporting something
 *  (irrelevant what might be).
 *
 *  @param {Object} element - AST node object with type `AssignmentExpression`.
 *  @return Boolean true if the left side is a module.exports expression.
 */
const moduleExportParser = (element) =>
  element.expression.type === 'AssignmentExpression' &&
  element.expression.operator === '=' &&
  element.expression.left.type === 'MemberExpression' &&
  element.expression.left.object.type === 'Identifier' &&
  element.expression.left.object.name === 'module' &&
  element.expression.left.property.type === 'Identifier' &&
  element.expression.left.property.name === 'exports'

module.exports = {
  declarationParser,
  extractPath,
  importParser,
  moduleExportParser,
  isValidExportNamedDeclaration
}
