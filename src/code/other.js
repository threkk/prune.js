const { Node, parse } = require('./trace')

function parseOther (node) {
  const loc = node.loc
  const declares = []
  const uses = []
  const children = []

  switch (node.type) {
    case 'Identifier':
      return new Node([node.name], { main: 'identifier', sub: node.type }, loc, declares, uses, children)
    case 'EmptyStatement':
      return new Node([], { main: 'empty', sub: node.type }, declares, uses, children)
    case 'DebuggerStatement':
      return new Node([], { main: 'debugger', sub: node.type }, declares, uses, children)
    case 'WithStatement':
      return new Node([], { main: 'with', sub: node.type }, parse(node.object).id, [], node.body)
  }
}

module.exports = parseOther
