const AbstractNode = require('../../abstract-node')

class BlockStatement extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['statement']
    })

    this.getChildren = this.getChildren.bind(this)
  }

  getChildren () {
    return this.node.body
  }
}

module.exports = BlockStatement
