class Logger {
  constructor (noColor) {
    this.errors = []
    this.warns = []
    this.noColor = noColor
  }

  warn (message, type = 'OTHER') {
    this.warns.push({type, message})
  }

  error (message, type = 'OTHER') {
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

    // TODO: Add (and disable) colors.
    this.errors.map(tuple => show(tuple)).forEach(msg => console.log(`[ERROR]${msg}`))
    if (warnings) {
      this.warns.map(tuple => show(tuple)).forEach(msg => console.log(`[WARN]${msg}`))
    }
  }
}

module.exports = Logger
