const AbstractNode = require('../../../abstract-node')

class IfStatement extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['statement']
    })

    this.getSymbols = this.getSymbols.bind(this)
    this.getUsage = this.getUsage.bind(this)
    this.getChildren = this.getChildren.bind(this)
  }

  getSymbols (scope, factory) {
    const test = factory.create(this.node.test)
    const consequent = factory.create(this.node.consequent)

    let symbols = []
    symbols = symbols.concat(test.getSymbols(scope, factory))
    symbols = symbols.concat(consequent.getSymbols(scope, factory))

    if (this.node.alternate) {
      const alternate = factory.create(this.node.alternate)
      symbols = symbols.concat(alternate.getSymbols(scope, factory))
    }

    return symbols
  }

  getUsage (scope, factory) {
    const test = factory.create(this.node.test)
    const consequent = factory.create(this.node.consequent)

    let usage = []
    usage = usage.concat(test.getUsage(scope, factory))
    usage = usage.concat(consequent.getUsage(scope, factory))

    if (this.node.alternate) {
      const alternate = factory.create(this.node.alternate)
      usage = usage.concat(alternate.getUsage(scope, factory))
    }

    return usage
  }

  getChildren (scope, factory) {
    const test = factory.create(this.node.test)
    const consequent = factory.create(this.node.consequent)

    let children = []
    children = children.concat(test.getChildren(scope, factory))
    children = children.concat(consequent.getChildren(scope, factory))

    if (this.node.alternate) {
      const alternate = factory.create(this.node.alternate)
      children = children.concat(alternate.getChildren(scope, factory))
    }

    return children
  }
}

module.exports = IfStatement
