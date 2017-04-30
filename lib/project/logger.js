const Report = require('./report')

class Logger {
  constructor () {
    this._dependencies = []
    this._modules = []
    this._code = []
  }

  report (rep) {
    switch (rep.type) {
      case Report.DEPENDENCY() : this._dependencies.push(rep); break
      case Report.MODULE(): this._modules.push(rep); break
      case Report.CODE() : this._code.push(rep); break
    }
  }

  get dependencies () {
    return this._dependency
  }

  get modules () {
    return this._modules
  }

  get code () {
    return this._code
  }
}

module.exports = Logger
