const AbstractAnalyser = require('../abstract/analyser')
const AST = require('../project/ast')
const Context = require('./context')

class CodeAnalyser extends AbstractAnalyser {
  constructor (config, files) {
    super()
    this._files = files
    this._root = config.path
    this._withES7 = config.withES7
    this._withJSX = config.withJSX
  }

  analyse (logger) {
    return Promise.all(this._files.map(filePath => {
      try {
        const ast = new AST(filePath, this._withES7, this._withJSX)
        const ctx = new Context(ast.body, [])
        const notUsed = ctx.analyse()

        if (notUsed.length > 0) {
          for (let nu of notUsed) {
            console.log(`Not used ${nu._type} at ${filePath}:${nu._loc.start.line}`, nu)
          }
        }
      } catch (e) {
        console.error(e)
      }
    })).then(() => true)
  }
}

module.exports = CodeAnalyser
