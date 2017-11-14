const AST = require('../project/ast')
const parse = require('./parser')

class Trace {
  constructor (filePath, statementNodes, exportNodes) {
    this._filePath = filePath
    this._exported = exportNodes || []
    this._statements = statementNodes || []
  }

  get path () {
    return this._filePath
  }

  get exported () {
    return this._exported
  }

  get statements () {
    return this._statements
  }

  static create (filePath, withES7, withJSX) {
    const ast = new AST(filePath, withES7, withJSX)
    const isValidBody =
      ast != null &&
      ast.ast != null &&
      ast.ast.program != null &&
      ast.ast.program.sourceType === 'module' &&
      Array.isArray(ast.ast.program.body)

    const nodes = []
    const exportNodes = []
    if (isValidBody) {
      for (let node of ast.ast.program.body) {
        const element = parse(node)

        switch (element.type) {
          case 'ExpressionStatement':
            if (element.isModuleExportExpr) {
              exportNodes.push(element)
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
              exportNodes.push(element.declaration)
            } else if (isNotEmptySpecifier) {
              element.specifiers.forEach((specifier) => exportNodes.push(specifier))
            }
            break

          case 'ExportDefaultDeclaration':
            exportNodes.push(element)
            break

          case 'ExportAllDeclaration':
            exportNodes.push(element)
            break
        }
        nodes.push(element)
      }
      return new Trace(filePath, nodes, exportNodes)
    }
    return null
  }
}

module.exports = Trace
