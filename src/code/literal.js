const { Node, parse } = require('./trace')

function parseLiteral (node) {
  const id = []
  const type = {
    main: 'literal',
    sub: node.type
  }
  const loc = node.loc
  const declares = []
  const uses = []
  const children = []

  switch (node.type) {
    case 'RegExpLiteral':
    case 'NullLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NumericLiteral':
      break
    case 'TemplateLiteral':
    case 'TaggedTemplateExpression':
    case 'TemplateElement':
      // TODO: WTF!?
  }
  return new Node(id, type, loc, declares, uses, children)
}

module.exports = parseLiteral
