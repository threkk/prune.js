const { dirname, extname, isAbsolute, resolve } = require('path')
const { existsSync } = require('fs')

const AST = require('../project/ast')

class Module {
  constructor (filePath, uses, isExported) {
    this._filePath = filePath
    this._isExported = isExported
    this._uses = uses
  }

  get isExported () {
    return this._isExported
  }

  get uses () {
    return this._uses
  }

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
