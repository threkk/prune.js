const { Node, parse } = require('./trace')

function parseVariable (node) {
  const id = []
  const type = {
    main: 'variable',
    sub: node.type
  }

  const loc = node.loc
  const declares = []
  const uses = []
  const children = []

  switch (node.type) {
    case 'Pattern':
      break
    case 'AssignmentProperty':
      uses.push(parse(node).id)
      break
    case 'ObjectPattern':
      node.properties.forEach((prop) => uses.push(parse(prop).id))
      break
    case 'ArrayPattern':
    case 'RestElement':
    case 'AssignmentPattern':
    case 'VariableDeclaration':
      node.declarations.forEach((decl) => id.push(parse(decl).id))
      break
    case 'VariableDeclarator':
      id.push(node.id.name)
      if (node.init != null) {
        parse(node.init).id.forEach((id) => uses.push(id))
      }
      break
  }

  return new Node(id, type, loc, declares, uses, children)
}

module.exports = parseVariable
