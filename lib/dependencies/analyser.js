const depcheck = require('depcheck')
const { promisify } = require('util')
const { resolve } = require('path')
const { existsSync } = require('fs')

const readJSON = promisify(require('read-package-json'))

const SPECIALS = {
  babel: depcheck.special.babel,
  eslint: depcheck.special.eslint,
  gulp: depcheck.special['gulp-load-plugins'],
  standard: depcheck.special['feross-standard'],
  mocha: depcheck.special.mocha,
  webpack: depcheck.special.webpack
}

const existsPkg = (p) => existsSync(p) && existsSync(resolve(p, 'package.json'))
const check = async (path, config) => {
  const dpc = promisify(depcheck)

  // Depcheck does not follow the standard of nodejs callbacks and instead of
  // returning (error, data), returns only data. Therefore, in order to get
  // the result we need to check if the object returned is the data or a real
  // error to rethrow it as all output is considered an error by promisfy.
  try {
    await dpc(path, config)
  } catch (maybeErr) {
    if (maybeErr instanceof Error) {
      throw maybeErr
    }
    return maybeErr
  }
}

class DependenciesAnalyser {
  constructor (config) {
    const parsers = { '*.js': depcheck.parser.es7 }

    if (config.jsx) {
      parsers['*.jsx'] = depcheck.parser.jsx
    }

    this.root = config.root
    this.config = {
      ignoreDirs: config.ignore,
      parsers,
      detectors: [
        depcheck.detector.gruntLoadTaskCallExpression, // Not default.
        depcheck.detector.importDeclaration,
        depcheck.detector.requireCallExpression,
        depcheck.detector.requireResolveCallExpression // Not default.
      ],
      specials: [
        depcheck.special.bin
      ]
    }
  }

  static getName () {
    return 'DEPENDENCY'
  }

  async start (log) {
    if (!existsPkg(this.root)) {
      log('package.json not found. Skipping dependency analysis...')
      return
    }

    // We make our own copy of the configuration for this project. Some of the
    // options cannot be configured globally but per project.
    const pkgPath = resolve(this.root, 'package.json')
    const config = Object.assign({}, this.config)
    const enablers = Object.keys(SPECIALS)
    const pkg = await readJSON(pkgPath)

    for (const dep in pkg.dependencies) {
      if (enablers.includes(dep)) {
        config.specials.push(SPECIALS[dep])
      }
    }

    for (const dep in pkg.devDependencies) {
      if (enablers.includes(dep)) {
        config.specials.push(SPECIALS[dep])
      }
    }

    try {
      const {
        dependencies,
        devDependencies,
        missing
      } = await check(this.root, config)

      dependencies.forEach(dependency => log(`Dependency: ${dependency}`))
      devDependencies.forEach(devDep => log(`Dev-dependency: ${devDep}`))
      Object.keys(missing).forEach(m => log(`Found and missing at pkg: ${m}`))
    } catch (e) {
      log(e)
    }
  }
}

module.exports = DependenciesAnalyser
