class Scope {
  constructor () {
    this._nodes = []
    this._symbols = {}
    this._usage = {}
    this._types = {}
  }

  registerStatement (sttm) {
    if (!sttm.isType('statement')) {
      return null
    }

    const len = this._nodes.push(sttm)
    const newId = len - 1

    this._symbols[newId] = sttm.getSymbols()
    this._usage[newId] = sttm.getUsage()

    const mainType = sttm.node.type
    if (typeof this._types[mainType] === 'undefined') {
      this._types[mainType] = []
    }

    this._types[mainType].push(newId)

    return newId
  }
}

module.exports = Scope
