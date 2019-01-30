const createASTParser = require('../project/ast')
const extractFiles = require('../project/files')
// const statements = require('./statements')
const { createScope } = require('./scope')

class FileAnalyser {
  /**
   * @param {Object} config Configuration object.
   * @param {string} config.root Root path.
   * @param {string[]} config.ignore Ignored folders.
   * @param {bool} config.jsx Enables JSX support.
   * @param {Logger} config.logger Logger
   * @param {bool} noColor Disables the colour support.
   */
  constructor (config) {
    this.config = config
    this.parser = createASTParser(this.config.jsx)
  }

  /** @return {string} FILE */
  static getName () {
    return 'FILE'
  }

  async start (log) {
    const { root, ignore, jsx } = this.config
    const validExtensions = ['.js']
    if (jsx) {
      validExtensions.push('.jsx')
    }
    const files = await extractFiles(root, ignore, validExtensions)
    files.forEach(async f => {
      try {
        const tree = await this.parser(f)
        const scope = createScope('function')
        console.log(`Executing ${f}`)
        scope.populate(tree)
        console.log('Executing')
        console.log(f, scope)
      } catch (e) {
        console.log(e)
        log(`File ${f} could not be parsed: ${e.message}`)
      }
    })
  }
}

module.exports = FileAnalyser
