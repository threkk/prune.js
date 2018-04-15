const AbstractNode = require('../../../abstract-node')

class SwitchCaseStatement extends AbstractNode {
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
    let symbols = []
    if (this.node.test != null) {
      const test = factory.create(this.node.test)
      symbols = test.getSymbols(scope, factory)
    }

    const consequent = this.node.consequent.map(consq =>
      factory.create(consq).getSymbols(scope, factory))

    return symbols.concat(consequent.reduce((acc, val) => acc.concat(val), []))
  }

  getUsage (scope, factory) {
    let usage = []
    if (this.node.test != null) {
      const test = factory.create(this.node.test)
      usage = test.getUsage(scope, factory)
    }

    const consequent = this.node.consequent.map(consq =>
      factory.create(consq).getUsages(scope, factory))

    return usage.concat(consequent.reduce((acc, val) => acc.concat(val), []))
  }

  getChildren (scope, factory) {
    let children = []
    if (this.node.test != null) {
      const test = factory.create(this.node.test)
      children = test.getChildren(scope, factory)
    }

    const consequent = this.node.consequent.map(consq =>
      factory.create(consq).getChildren(scope, factory))

    return children.concat(consequent.reduce((acc, val) => acc.concat(val), []))
  }
}

module.exports = SwitchCaseStatement
