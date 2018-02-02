const AbstractNode = require('../abstract-node')

class Identifier extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['expression', 'pattern']
    })

    this.getValue.bind(this)
  }

  getValue () {
    return this.node.name
  }
}

module.exports = Identifier
