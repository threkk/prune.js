const AbstractNode = require('../../abstract-node')

class WithStatement extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['statement']
    })
    throw new TypeError('TODO')
  }
}

module.exports = WithStatement
