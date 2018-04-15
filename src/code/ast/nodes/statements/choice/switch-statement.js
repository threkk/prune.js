const AbstractNode = require('../../../abstract-node')

class SwitchStatement extends AbstractNode {
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
    const discriminant = factory.create(this.node.discriminant)
    let symbols = discriminant.getSymbols(scope, factory)

    const cases = this.node.cases.map(c =>
      factory.create(c).getSymbols(scope, factory))

    return symbols.concat(cases.reduce((acc, val) => acc.concat(val), []))
  }

  getUsage (scope, factory) {
    const discriminant = factory.create(this.node.discriminant)
    let usage = discriminant.getUsage(scope, factory)

    const cases = this.node.cases.map(c =>
      factory.create(c).getUsages(scope, factory))

    return usage.concat(cases.reduce((acc, val) => acc.concat(val), []))
  }

  getChildren (scope, factory) {
    const discriminant = factory.create(this.node.discriminant)
    let children = discriminant.getChildren(scope, factory)

    const cases = this.node.cases.map(c =>
      factory.create(c).getChildren(scope, factory))

    return children.concat(cases.reduce((acc, val) => acc.concat(val), []))
  }
}

module.exports = SwitchStatement
