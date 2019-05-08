import chalk from 'chalk'

export class Logger {
  private errors: string[]
  private warnings: string[]
  private exceptions: string[]

  warn(message: string): void {
    this.warnings.push(message)
  }

  error(message: string): void {
    this.errors.push(message)
  }

  exception(message: string): void {
    this.exceptions.push(message)
  }

  display(warnings: boolean = false) {
    const noColor: boolean = Boolean(process.env.NO_COLOR) || false
    const underline: (s: string) => any = noColor ? s => s : chalk.underline
    const exception: (s: string) => any = noColor ? s => s : chalk.red
    const error: (s: string) => any = noColor ? s => s : chalk.magenta
    const warn: (s: string) => any = noColor ? s => s : chalk.yellow

    const output: string[] = []
    if (this.exceptions) {
      output.push(underline(exception('Exceptions: ')))
      this.exceptions.forEach(
        (m: string): any => output.push(`[${exception('EXCEPTION')}]: ${m}`)
      )
    }

    if (this.error) {
      output.push(underline(error('Errors: ')))
      this.errors.forEach(
        (m: string): any => output.push(`[${error('ERROR')}]: ${m}`)
      )
    }

    if (this.warn && warnings) {
      output.push(underline(error('Warnings: ')))
      this.warnings.forEach(
        (m: string): any => output.push(`[${warn('WARNING')}]: ${m}`)
      )
    }

    console.info(output.join('\n'))
  }
}

let log: Logger = null
if (log == null) {
  log = new Logger()
}

export default log
