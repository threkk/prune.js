const { Node, parse } = require('./trace')

function parseFlow (node) {
  const id = []
  const type = {
    main: 'flow',
    sub: node.type
  }
  const loc = node.loc
  let declares = []
  let uses = []
  const children = []

  switch (node.tye) {
    case 'ReturnStatement':
      if (node.argument != null) {
        uses = uses.concat(parse(node.argument).uses)
      }
      break
    case 'LabeledStatement':
      declares = declares.concat(parse(node.label).id)
      children.push(node.body)
      break
    case 'BreakStatement':
    case 'ContinueStatement':
      if (node.label != null) {
        uses = uses.concat(parse(node.label).uses)
      }
      break
    case 'IfStatement':
      uses = uses.concat(parse(node.test).uses)
      children.push(node.consequent)
      if (node.alternate != null) {
        children.push(node.consequent)
      }
      break
    case 'SwitchStatement':
      uses = uses.concat(parse(node.test).uses)
      node.cases.forEach((caseNode) => children.push(caseNode))
      break
    case 'SwitchCase':
      if (node.test != null) {
        uses = uses.concat(parse(node.test).uses)
      }
      node.consequent.forEach((con) => children.push(con))
      break
    case 'ThrowStatement':
      uses = uses.concat(parse(node.argument).uses)
      break
    case 'TryStatement':
      node.block.body.forEach(b => children.push(b))
      if (node.handler != null) {
        uses = uses.concat(parse(node.handler.param).uses)
        node.handler.body.body.forEach(b => children.push(b))
      } else {
        node.finalizer.body(b => children.push(b))
      }
      break
    case 'CatchClause':
      break
    case 'WhileStatement':
    case 'DoWhileStatement':
      uses = uses.concat(parse(node.test).uses)
      node.body.forEach(b => children.push(b))
      break
    case 'ForStatement':
      if (node.init != null) {
        declares = declares.concat(parse(node.init).id)
      }

      if (node.test != null) {
        uses = uses.concat(parse(node.test).uses)
      }

      if (node.update != null) {
        uses = uses.concat(parse(node.update).uses)
      }
      break
    case 'ForInStatement':
      declares = declares.concat(parse(node.left).id)
      uses = uses.concat(parse(node.right).uses)
      node.body.forEach(b => children.push(b))
      break
    case 'ForOfStatement':
      break
  }

  return new Node(id, type, loc, declares, uses, children)
}

module.exports = parseFlow
