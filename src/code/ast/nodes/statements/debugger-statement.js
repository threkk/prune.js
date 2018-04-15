const AbstractNode = require('../../abstract-node')

class DebuggerStatement extends AbstractNode {
  constructor (node) {
    super({
      node,
      parentTypes: ['statement']
    })
  }
}

module.exports = DebuggerStatement
