const AbstractAnalyser = require('../abstract/analyser')
const Trace = require('./trace')

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
          console.log(filePath)
          const trace = Trace.create(filePath, this._withES7, this._withJSX)
          if (trace != null && trace._nodes.length > 0) {
            //          console.log('Exports', trace._nodes)
            // console.log('Body', trace._statements)
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
