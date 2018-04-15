class AbstractNode {
  constructor ({ node, category, parentTypes }) {
    if (new.target === AbstractNode) {
      throw new TypeError('new of abstract class Node')
    }

    this._node = node
    this._types = [node.type.toLowerCase()].concat(parentTypes)
  }

  get node () {
    return this._node
  }

  get location () {
    return this._node.loc
  }

  isType (type) {
    return this._types.includes(type)
  }

  getSymbols () {
    throw new TypeError(`method not implemented in the class ${this.node.type}`)
  }

  getUsage () {
    throw new TypeError(`method not implemented in the class ${this.node.type}`)
  }

  /**
   * Given a node, it returns its children as a new scope.
   */
  getChildren (scope, factory) {
    throw new TypeError(`method not implemented in the class ${this.node.type}`)
  }

  getValue () {
    throw new TypeError(`method not implemented in the class ${this.node.type}`)
  }

  getId () {
    throw new TypeError(`method not implemented in the class ${this.node.type}`)
  }
}

module.exports = AbstractNode
