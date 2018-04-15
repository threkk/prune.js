const AbstractNode = require('../../../abstract-node')
const Identifier = require('../../identifier')

class LabeledStatement extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['statement']
    })

    this.getSymbols = this.getSymbols.bind(this)
    this.getChildren = this.getChildren.bind(this)
  }

  getSymbols (scope, factory) {
    const id = new Identifier(this.node.label)
    return id.getValue()
  }

  getChildren (scope, factory) {
    return this.node.body
  }
}

module.exports = LabeledStatement
