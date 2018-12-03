const chalk = require('chalk')

class Project {
  constructor (config) {
    this.config = config

    let { bold, underline, green, red } = chalk
    if (this.config.noColor) {
      bold = underline = green = red = (str) => str
    }

    // Start message
    const check = green('✔')
    const uncheck = red('✘')

    console.log(`Starting ${bold('prunejs')} on ${this.config.root}`)
    console.log('')
    console.log(underline('Options:'))
    console.log(`  ${this.config.jsx ? check : uncheck} JSX`)
    console.log('')
    console.log(`The following folders are ${bold('ignored')}:`)
    this.config.ignore.forEach((dir) => console.log(`  - ${dir}`))
    console.log('')
  }

  report (name, msg) {
    this.config.logger.error(msg, name)
  }

  async analyse (Analyser) {
    const name = Analyser.getName()
    const analyser = new Analyser(this.config)
    const log = (msg) => this.report(name, msg)
    console.log(`[•] Starting analyser: ${name}.`)
    try {
      await analyser.start(log)
    } catch (e) {
      console.log(e)
    }
  }

  async flush () {
    if (!this.config.logger.hasErrors()) {
      console.log('No errors found.')
    }
    this.config.logger.display()
  }
}

module.exports = Project
