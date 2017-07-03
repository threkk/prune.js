class AbstractNode {
  constructor (loc, type) {
    if (new.target === AbstractNode) {
      throw TypeError('new of abstract class Node')
    }

    this._loc = loc
    this._type = type
    this._declares = []
    this._returns = []
    this._uses = []
  }

  get loc () {
    return this._loc
  }

  get type () {
    return this._type
  }

  get declares () {
    return this._declares
  }

  get uses () {
    return this._uses
  }

  get returns () {
    return this._returns
  }

  set declares (val) {
    if (Array.isArray(val)) {
      this._declares = this._declares.concat(val)
    } else {
      this._declares.push(val)
    }
  }

  set returns (val) {
    if (Array.isArray(val)) {
      this._returns = this._returns.concat(val)
    } else {
      this._returns.push(val)
    }
  }

  set uses (val) {
    if (Array.isArray(val)) {
      this._uses = this._uses.concat(val)
    } else {
      this._uses.push(val)
    }
  }
}

module.exports = AbstractNode