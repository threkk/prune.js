const chalk = require('chalk')
const fs = require('fs')
const ora = require('ora')

const ErrorReport = require('./report/error')

const { extname, resolve } = require('path')
const { promisify } = require('util')

const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

/**
 * The Project class acts as a monad and holds all the different analysers to
 * apply to the project.
 */
class Project {
  /**
   * Creates a Project instance
   *
   * @constructor
   * @param {Config} config - Configuration of the project from the CLI.
   * @param {Logger} logger - Logger where the analysers report their findings.
   */
  constructor (config, logger) {
    this.analysers = []
    this.config = config
    this.logger = logger
    this.validExt = ['.js']

    if (this.config.withJSX) {
      this.validExt.push('.jsx')
    }
  }

  /**
   * Attaches the analyser to the project. It will report its findings to the
   * logger.
   *
   * @param {Analyser} analyser - Analyser to attach.
   * @return {Project} - The objects itself to allow method chaining.
   */
  analyse (Analyser) {
    this.analysers.push(new Analyser(this.config))
    return this
  }

  /**
   * Executes all the registered analysers and display the results in the
   * screen.
   */
  async execute () {
    const check = chalk.green('✔')
    const uncheck = chalk.red('✘')

    console.log(`Starting ${chalk.bold('prunejs')} on ${this.config.path}`)
    console.log('')
    console.log(chalk.underline('Options:'))
    console.log(`  ${this.config.withES7 ? check : uncheck} ES7`)
    console.log(`  ${this.config.withJSX ? check : uncheck} JSX`)
    console.log('')
    console.log(`The following folders are ${chalk.bold('ignored')}:`)
    this.config.ignoreDirs.forEach((dir) => console.log(`  - ${dir}`))
    console.log('')

    const spinner = ora('Processing...').start()
    try {
      const files = await this.extractFiles(this.config.path)
      await Promise.all(this.analysers.map(a => a.analyse(this.logger, files)))

      spinner.succeed('Success!')
      console.log('')

      this.logger.displayDependencies()
      this.logger.displayModules()
      this.logger.displayCode()

      if (this.logger.hasErrors(ErrorReport.symbol())) {
        this.logger.displayErrors()
      }
    } catch (err) {
      spinner.fail(`Error found.`)

      const error = new ErrorReport('executable', err.message)
      console.log(err)
      this.logger.report(error)
      this.logger.displayErrors()
    }
  }

  /**
   * Extracts all the file paths from the project. Valid files depend on the
   * configuration. `node_modules` are always ignored.
   */
  async extractFiles () {
    const dirs = []
    const files = []

    dirs.push(this.config.path)
    while (dirs.length > 0) {
      const dir = dirs.pop()
      try {
        const items = await readdir(dir)
        const results = await Promise.all(items.map(item => this.processFile(dir, item)))

        results.forEach(result => {
          switch (result.action) {
            case 'pushDir': dirs.push(result.filePath); break
            case 'pushFile' : files.push(result.filePath); break
          }
        })
      } catch (e) {
        const error = new ErrorReport(dir, 'Error reading the directory')
        this.logger.report(error)
        continue
      }
    }
    return files
  }

  async processFile (dir, file) {
    const filePath = resolve(dir, file)
    const isIgnored = this.config.ignoreDirs.includes(filePath)
    const isHidden = file.charAt(0) === '.'
    const result = { filePath, action: 'none' }

    if (!isIgnored && !isHidden) {
      try {
        const stats = await stat(filePath)

        if (stats.isDirectory()) {
          result.action = 'pushDir'
        } else if (this.validExt.includes(extname(file))) {
          result.action = 'pushFile'
        }
      } catch (e) {
        const error = new ErrorReport(filePath, 'Error reading the file.')
        this.logger.report(error)
      }
    }
    return result
  }
}

module.exports = Project
