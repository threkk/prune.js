const depcheck = require('depcheck')
const Analyser = require('../project/analyser')

class DependenciesAnalyser extends Analyser {
  constructor (ignoreDirs, es7 = false, jsx = false) {
    super()
    const parsers = {
      '*.js': depcheck.parser.es6
    }

    if (es7) {
      parsers['*.js'] = depcheck.parser.es7
    }

    if (jsx) {
      parsers['*.jsx'] = depcheck.parser.jsx
    }
    console.log(parsers)
    this.config = {
      ignoreDirs,
      parsers,
      detectors: [
        depcheck.detector.gruntLoadTaskCallExpression, // Not default.
        depcheck.detector.importDeclaration,
        depcheck.detector.requireCallExpression,
        depcheck.detector.requireResolveCallExpression // Not default.
      ]
    }
  }

  analyse (path, logger) {
    depcheck(path, this.config, (unused) => {
      console.log(unused.dependencies)
    })
  }
}

module.exports = DependenciesAnalyser
