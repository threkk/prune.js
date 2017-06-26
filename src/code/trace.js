const AST = require('../project/ast')

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
      const exportNodes = []

      for (let element of ast.ast.program.body) {
        console.log(parse(element))
        switch (element.type) {
          case 'ExpressionStatement':
            const isModuleExportExpr =
              element.expression.type === 'AssignmentExpression' &&
              element.expression.left.type === 'MemberExpression' &&
              element.expression.left.object.type === 'Identifier' &&
              element.expression.left.object.name === 'module' &&
              element.expression.left.property.type === 'Identifier' &&
              element.expression.left.property.name === 'exports'

            if (isModuleExportExpr) {
              exportNodes.push(element.expression.right)
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
            exportNodes.push(element.declaration)
            break

          case 'ExportAllDeclaration':
            break
        }
      }
      return new Trace(filePath, ast.ast.program.body, exportNodes)
    }
    return null
  }
}

class Node {
  constructor (id, type, loc, declared, used, children) {
    this._id = id
    this._type = type
    this._loc = loc
    this.declared = declared
    this.used = used
    this.children = children
  }

  get id () {
    return this._id
  }

  get type () {
    return this._type
  }

  get loc () {
    return this._loc
  }
}

function parse (node) {
  switch (node.type) {
    case 'Class':
    case 'ClassDeclaration':
    case 'ClassExpression':
      return require('./class')(node)
    case 'Function':
    case 'ClassMethod':
    case 'FunctionDeclaration':
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return require('./function')(node)
    case 'Pattern':
    case 'AssignmentProperty':
    case 'ObjectPattern':
    case 'ArrayPattern':
    case 'RestElement':
    case 'AssignmentPattern':
    case 'VariableDeclaration':
    case 'VariableDeclarator':
      return require('./variable')(node)
    case 'Expression':
    case 'ExpressionStatement':
    case 'Super':
    case 'Import':
    case 'ThisExpression':
    case 'YieldExpression':
    case 'AwaitExpresion':
    case 'ArrayExpression':
    case 'ObjectExpression':
    case 'ObjectMember':
    case 'ObjectProperty':
    case 'ObjectMethod':
    case 'UnaryExpression':
    case 'UnaryOperator':
    case 'UpdateExpression':
    case 'UpdateOperator':
    case 'BinaryExpression':
    case 'BinaryOperator':
    case 'AssignmentExpression':
    case 'AssignmentOperator':
    case 'LogicalExpression':
    case 'LogicalOperator':
    case 'SpreadElement':
    case 'MemberExpression':
    case 'BindExpression':
    case 'ConditionalExpression':
    case 'CallExpression':
    case 'NewExpression':
    case 'SequenceExpression':
    case 'DoExpression':
      return require('./expression')(node)
    case 'RegExpLiteral':
    case 'NullLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NumericLiteral':
    case 'Template Literals':
    case 'TemplateLiteral':
    case 'TaggedTemplateExpression':
    case 'TemplateElement':
      return new Node([], { main: 'literal', sub: node.type }, node.loc, [], [], [])
    case 'Identifier':
    case 'EmptyStatement':
    case 'DebuggerStatement':
    case 'WithStatement':
      return require('./other')(node)
  }
}

module.exports = Trace
module.exports.Node = Node
module.exports.parse = parse
