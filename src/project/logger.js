class Logger {
  constructor () {
    this.errors = []
    this.warns = []
  }

  warn (message, type = 'ERROR') {
    this.warns.push({type, message})
  }

  error (message, type = 'ERROR') {
    this.errors.push({type, message})
  }

  hasErrors () {
    return this.errors.length > 0
  }

  hasWarnings () {
    return this.warns.length > 0
  }

  export () {
    return {
      errors: () => this.errors,
      warnings: () => this.warns
    }
  }

  display (warnings = false) {
    const show = ({ type, message }) => `[${type}] ${message}`
    this.errors.map(tuple => show).forEach(msg => console.log(msg))
    if (warnings) {
      this.warns.map(tuple => show).forEach(msg => console.log(msg))
    }
  }
}

Logger.ERROR = 'ERROR'
Logger.DEP = 'DEPENDENCY'
Logger.MOD = 'MODULE'
Logger.CODE = 'CODE'

module.exports = Logger
