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

  async analyse (Analyser) {
    const analyser = new Analyser(this.config)
    await analyser.start()
    return this
  }
}

module.exports = Project
