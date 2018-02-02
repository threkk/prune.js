const AbstractNode = require('../../abstract-node')

class NullLiteral extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['literal']
    })

    this.getValue.bind(this)
  }

  getValue () {
    return null
  }
}

module.exports = NullLiteral
