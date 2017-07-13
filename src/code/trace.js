const AST = require('../project/ast')
const parse = require('./parser')

class Trace {
  constructor (filePath, astBody, exportNodes) {
    this._filePath = filePath
    this._nodes = exportNodes
    this._statements = astBody
  }

  static create (filePath, withES7, withJSX) {
    const ast = new AST(filePath, withES7, withJSX)
    const isValidBody =
      ast != null &&
      ast.ast != null &&
      ast.ast.program != null &&
      ast.ast.program.sourceType === 'module' &&
      Array.isArray(ast.ast.program.body)

    if (isValidBody) {
      for (let node of ast.ast.program.body) {
        /*
        const element = parse(node)
        if (typeof element === 'undefined') {
          console.log(node)
        }

        switch (element.type) {
          case 'ExpressionStatement':
            if (element.returns.length > 0) {
              console.log(element)
            }
            const isModuleExportExpr =
              element.expression.type === 'AssignmentExpression' &&
              element.expression.left.type === 'MemberExpression' &&
              element.expression.left.object.type === 'Identifier' &&
              element.expression.left.object.name === 'module' &&
              element.expression.left.property.type === 'Identifier' &&
              element.expression.left.property.name === 'exports'

            if (isModuleExportExpr) {
              // exportNodes.push(element.expression.right)
            }
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
            } else if (isNotNullDeclaration) {
              // exportNodes.push(element.declaration)
            } else if (isNotEmptySpecifier) {
              // element.specifiers.forEach((specifier) => exportNodes.push(specifier))
            }
            break

          case 'ExportDefaultDeclaration':
            // exportNodes.push(element.declaration)
            break

          case 'ExportAllDeclaration':
            break
        }
        */
      }
      return new Trace(filePath, ast.ast.program.body, [])
    }
    return null
  }
}

module.exports = Trace
