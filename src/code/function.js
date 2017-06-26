const { Node, parse } = require('./trace')

function parseFunction (node) {
  const id = []
  const type = {
    main: 'function',
    sub: node.type
  }
  const loc = node.loc
  const declares = []
  const uses = []
  const children = []

  const body = node.body.body

  for (let param of node.params) {
    const id = parse(param).id
    declares.push(id)
  }

  if (node.id != null) id.push(node.id.name)

  switch (node.type) {
    case 'ClassMethod':
      body.forEach((element) => children.push(element))
      // WTF is key???
      throw Error('To implement: key')
    case 'ArrowFunctionExpression':
      if (node.expression) {
        children.push(body)
      } else {
        body.forEach((element) => children.push(element))
      }
      break
    case 'Function':
    case 'FunctionDeclaration':
    case 'FunctionExpression':
      body.forEach((element) => children.push(element))
      break
  }

  return new Node(id, type, loc, declares, uses, children)
}

module.exports = parseFunction
