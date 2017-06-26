const { Node, parse } = require('./trace')

function parseExpression (node) {
  let id = []
  const type = {
    main: 'expression',
    sub: node.type
  }
  const loc = node.loc
  const declares = []
  let uses = []
  const children = []

  switch (node.type) {
    case 'Expression':
      break
    case 'ExpressionStatement':
      uses = uses.concat(parse(node.expression).uses)
      break
    case 'Super':
      break
    case 'Import':
      break
    case 'ThisExpression':
      break
    case 'YieldExpression':
      if (node.argument != null) {
        uses = uses.concat(parse(node.argument).uses)
      }
      break
    case 'AwaitExpresion':
      if (node.argument != null) {
        uses = uses.concat(parse(node.argument).uses)
      }
      break
    case 'ArrayExpression':
      if (node.elements != null && Array.isArray(node.elements)) {
        node.elements.forEach((element) => {
          const elementUses = parse(element).uses
          uses = uses.concat(elementUses)
        })
      }
      break
    case 'ObjectExpression':
      if (node.properties != null && Array.isArray(node.properties)) {
        node.properties.forEach((prop) => {
          const propUses = parse(prop).uses
          uses = uses.concat(propUses)
        })
      }
      break
    case 'ObjectMember':
      uses = uses.concat(parse(node.key).uses)
      break
    case 'ObjectProperty':
      uses = uses.concat(parse(node.value).uses)
      break
    case 'ObjectMethod':
      break
    case 'UnaryExpression':
      uses = uses.concat(parse(node.argument).uses)
      break
    case 'UnaryOperator':
      break
    case 'UpdateExpression':
      uses = uses.concat(parse(node.argument).uses)
      break
    case 'UpdateOperator':
      break
    case 'BinaryExpression':
      const leftBinaryExpression = parse(node.left)
      // If it is a pattern, only the id is filled. If it is a expression, only
      // the uses is filled.
      uses = uses.concat(parse(node.right).uses, leftBinaryExpression.id, leftBinaryExpression.uses)
      break
    case 'BinaryOperator':
      break
    case 'AssignmentExpression':
      const leftAssignmentExpression = parse(node.left)
      uses = uses.concat(parse(node.right).uses)
      // Covering both cases, see above
      id = leftAssignmentExpression.id.concat(leftAssignmentExpression.uses)
      break
    case 'AssignmentOperator':
      break
    case 'LogicalExpression':
      uses = uses.concat(parse(node.right).uses, parse(node.left).uses)
      break
    case 'LogicalOperator':
      break
    case 'SpreadElement':
      uses = uses.concat(parse(node.argument).uses)
      break
    case 'MemberExpression':
      if (node.computed) {
        uses = uses.concat(parse(node.argument).uses)
      }
      break
    case 'BindExpression':
      if (node.object != null) {
        uses = uses.concat(parse(node.object).uses)
      } else {
        uses = uses.concat(parse(node.callee).uses)
      }
      break
    case 'ConditionalExpression':
      uses = uses.concat(parse(node.test).uses, parse(node.alternate).uses, parse(node.consequent).uses)
      break
    case 'CallExpression':
      node.arguments.forEach((arg) => {
        const argUses = parse(arg).uses
        uses = uses.concat(argUses)
      })
      break
    case 'NewExpression':
      break
    case 'SequenceExpression':
      node.expressions.forEach((expr) => {
        const exprUses = parse(expr).uses
        uses = uses.concat(exprUses)
      })
      break
    case 'DoExpression':
      node.body.forEach((b) => {
        const child = b
        children.push(child)
      })
      break
  }

  return new Node(id, type, loc, declares, uses, children)
}

module.exports = parseExpression
