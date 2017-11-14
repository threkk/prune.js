const AbstractAnalyser = require('../abstract/analyser')
const Trace = require('./trace')
const _ = require('underscore')

class CodeAnalyser extends AbstractAnalyser {
  constructor (config, files) {
    super()
    this._files = files
    this._root = config.path
    this._withES7 = config.withES7
    this._withJSX = config.withJSX
  }

  analyse (logger) {
    return new Promise((resolve, reject) => {
      for (const filePath of this._files) {
        try {
          const trace = Trace.create(filePath, this._withES7, this._withJSX)
          if (trace != null) {
            console.log(trace.path)

            const usedNodes = _.flatten(trace.exported.map(e => e.uses))
            // FIRST LEVEL :D
            const unUsedNodes = trace.statements.filter(node => !node.returns.reduce((acc, ret) => acc || usedNodes.includes(ret), false))
            unUsedNodes.forEach(node => {
              console.log(node.loc)
            })
          }
        } catch (e) {
          console.log(e)
        }
      }
      resolve(true)
    })
  }
}

module.exports = CodeAnalyser
