const { Node, parse } = require('./trace')

function parseClass (node) {
  const id = []
  const type = {
    main: 'class',
    sub: node.type
  }
  const loc = node.loc
  const declares = []
  const uses = []
  const children = []

  if (node.id != null) id.push(node.id.name)

  if (node.superClass != null) {
    const superClass = parse(node.superClass)
    uses.push(superClass.id)
  }

  const body = node.body.body
  for (let b of body) {
    switch (b.type) {
      case 'ClassMethod':
        declares.push(b.key.name)
        children.push(b)
        break

      case 'ClassProperty':
        // ES7 stage 2 proposal
        // https://github.com/tc39/proposal-class-fields
        declares.push(b.key.name)
        children.push(b.value)
        break

      case 'ClassPrivateProperty':
        declares.push(b.key.name)
        children.push(b.value)
        break
    }
  }
  return new Node(id, type, loc, declares, uses, children)
}

module.exports = parseClass
