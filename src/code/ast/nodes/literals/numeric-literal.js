const AbstractNode = require('../../abstract-node')

class NumericLiteral extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['literal']
    })

    this.getValue.bind(this)
  }

  getValue () {
    return this.node.value
  }
}

module.exports = NumericLiteral
