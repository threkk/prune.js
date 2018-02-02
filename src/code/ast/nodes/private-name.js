const AbstractNode = require('../abstract-node')
const Identifier = require('./identifier')

class PrivateName extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['expression', 'pattern']
    })

    this.getValue.bind(this)
  }

  getValue () {
    const id = new Identifier(this.node.id)

    return id.getValue()
  }
}

module.exports = PrivateName
