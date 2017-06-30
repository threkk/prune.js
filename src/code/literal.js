const { Node, parse } = require('./trace')

function parseLiteral (node) {
  const id = []
  const type = {
    main: 'literal',
    sub: node.type
  }
  const loc = node.loc
  const declares = []
  let uses = []
  const children = []

  switch (node.type) {
    case 'RegExpLiteral':
    case 'NullLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NumericLiteral':
    case 'TemplateElement':
      break
    case 'TemplateLiteral':
      node.quasis.forEach((q) => {
        const quasi = parse(q).uses
        uses = uses.concat(quasi)
      })

      node.expressions.forEach((expr) => {
        const expression = parse(expr).uses
        uses = uses.concat(expression)
      })
      break
    case 'TaggedTemplateExpression':
      if (node.tag != null) {
        uses = uses.concat(parse(node.tag).uses)
      }

      if (node.quasi != null) {
        uses = uses.concat(parse(node.quasi).uses)
      }
      break
  }
  return new Node(id, type, loc, declares, uses, children)
}

module.exports = parseLiteral
