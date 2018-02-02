const AbstractNode = require('../../abstract-node')

class RegExpLiteral extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['literal']
    })
    this.getValue.bind(this)
  }

  getValue () {
    return `/${this.node.pattern}/${this.node.flags}`
  }
}

module.exports = RegExpLiteral
