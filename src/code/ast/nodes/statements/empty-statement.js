const AbstractNode = require('../../abstract-node')

class EmptyStatement extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['statement']
    })
  }
}

module.exports = EmptyStatement
