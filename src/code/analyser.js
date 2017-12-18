const AbstractAnalyser = require('../abstract/analyser')
const AST = require('../project/ast')
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
    return Promise.all(this._files.map(filePath => {
      try {
        const ast = new AST(filePath, this._withES7, this._withJSX)
        const notUsedNodes = this.analyseContext(filePath, ast.body, [])
      } catch (e) {
        console.error(e)
      }
    })).then(() => true)
  }

  analyseContext (filePath, context, notUsed) {
    const trace = new Trace(filePath, context, notUsed)
    const ret = trace.analyse()
    // For each node in the context, get children and repeat. Need to find a way
    // to combine the responses (and to make them parallel with promises).
    const amountNodes = context.length
    const amountNotUsed = ret.length
    const amountUsed = context.map(node => {
      if (ret.includes(node)) {
        return null
      }
      return node
    }).filter(node => node !== null).length

    console.log(ret)
    console.log(amountNodes, amountNotUsed, amountUsed)
  }
}

module.exports = CodeAnalyser
