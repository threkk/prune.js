import chalk, { Chalk, ColorSupport } from 'chalk'

type Color = (Chalk & { supportColor: ColorSupport }) | ((s: string) => string)
const noop: Color = (s: string) => s

export interface Config {
  root: string
  ignore: string[]
  jsx: boolean
}

export default class Project {
  constructor(private config: Config) {
    let bold: Color = chalk.bold
    let underline: Color = chalk.underline
    let green: Color = chalk.green
    let red: Color = chalk.red

    if (process.env.noColor) {
      bold = underline = green = red = noop
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
    this.config.ignore.forEach(dir => console.log(`  - ${dir}`))
    console.log('')
  }

  async analyse(Analyser) {
    const name = Analyser.getName()
    const analyser = new Analyser(this.config)
    console.log(`[•] Starting analyser: ${name}.`)

    try {
      await analyser.start()
    } catch (e) {
      console.log(e)
    }
  }

  async flush() {
    if (!logger.hasErrors()) {
      console.log('No errors found.')
    }
    logger.display()
  }
}
