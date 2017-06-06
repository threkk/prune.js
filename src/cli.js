#!/usr/bin/env node --harmony
const pkg = require('../package.json')
const program = require('commander')
const { exit } = require('process')

const Config = require('./project/config')
const ErrorIssue = require('./project/error')
const Logger = require('./project/logger')
const Project = require('./project/project')

const DependenciesAnalyser = require('./dependencies/analyser')
const ModulesAnalyser = require('./modules/analyser')

// Default configuration.
const config = new Config()

// Initialise the logger.
const logger = new Logger()

// Sets the CLI.
program
  .version(pkg.version)
  .description(pkg.description)
  .usage('[options] <path>')
  .option('-i, --ignore', 'excludes the following folders. "node_modules" is always ignored.')
  .option('-x, --jsx', 'adds JSX syntax support.')
  .option('-7, --es7', 'adds ES7 support.')
  // Hacking a bit the library. This turns the last argument into a variadic
  // argument. That way we can use it to transform the option `ignore` into a
  // list of ignored files (all but the last one) instead of
  .arguments('<path...>')
  .action((paths, options) => {
    const p = paths.pop()

    if (options.ignore) {
      for (let dir of paths) {
        config.ignoreDirs = dir
      }
    } else if (paths.length > 0) {
      const error = new ErrorIssue(paths, 'Unsupported parameters found.')
      logger.report(error)
      logger.displayErrors()
      exit(1)
    }

    const isValid = Project.isValidPath(p)
    if (isValid.valid) {
      config.path = isValid.path
    } else {
      const error = new ErrorIssue(p, isValid.error)
      logger.report(error)
      logger.displayErrors()
      exit(1)
    }
  })
  .parse(process.argv)

// Extracts the configuration.
if (program.es7) config.withES7 = true
if (program.jsx) config.withJSX = true

// Initalises the project.
const project = new Project(config, logger)

project
  .analyse(DependenciesAnalyser)
  .analyse(ModulesAnalyser)
  .execute()
