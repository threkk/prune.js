const AbstractNode = require('../../abstract-node')

class ExpressionStatement extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['statement']
    })

    this.getSymbols = this.getSymbols.bind(this)
    this.getUsage = this.getUsage.bind(this)
  }

  getSymbols (scope, factory) {
    const expr = factory.create(this.node.expression)
    return expr.getSymbols(scope)
  }

  getUsage (scope, factory) {
    const expr = factory.create(this.node.expression)
    return expr.getUsage(scope)
  }

  getChildren (scope, factory) {
    const expr = factory.create(this.node.expression)
    return expr.getChildren(scope, factory)
  }
}

module.exports = ExpressionStatement
