const AbstractNode = require('../../../abstract-node')

class ReturnStatement extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['statement']
    })
    // this.getSymbols does not apply because you cannot assign symbols in a return.
    this.getUsage = this.getUsage.bind(this)
  }

  getUsage (scope, factory) {
    if (this.node.argument === null) {
      return []
    }
    const expr = factory.create(this.node.argument)
    return expr.getUsage(scope)
  }
}

module.exports = ReturnStatement
