const AbstractAnalyser = require('../abstract/analyser')
const AST = require('../project/ast')
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
    return Promise.all(this._files.map(filePath => {
      try {
        const ast = new AST(filePath, this._withES7, this._withJSX)
        this.analyseContext(filePath, ast.body, [])
      } catch (e) {
        console.error(e)
      }
    })).then(() => true)
  }


  // TODO: There must be recursion here, but I am so dumb right now that after
  // two days I cannot see it.
  analyseContext (filePath, context, remanent) {
    const trace = new Trace(filePath, context, remanent)
    const { notUsed, used } = trace.analyse()

    // For each node in the context, get children and repeat. Need to find a way
    // to combine the responses (and to make them parallel with promises).
    const children = used.map(u => u.children).filter(arr => arr.length > 0)
    const nextContext = children.map(child => {
      const childTrace = new Trace(filePath, child, notUsed)
      return childTrace.analyse()
    }).reduce((acc, value, index, arr) => {
      const { notUsed, used } = value

      return {

      }
    }, { notUsed: [], used: [] });

    console.log(filePath)
    console.log(context.length, notUsed, used)
  }
}

module.exports = CodeAnalyser
