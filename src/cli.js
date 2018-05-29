#!/usr/bin/env node --harmony
const pkg = require('../package.json')
const program = require('commander')
const { exit } = require('process')

const Config = require('./project/config')
const ErrorReport = require('./project/report/error')
const Logger = require('./project/logger')
const Project = require('./project/project')

// const CodeAnalyser = require('./code/analyser')
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
  .arguments('<path...>')
  .parse(process.argv)

// Hacking a bit the library. This turns the last argument into a variadic
// argument. That way we can use it to transform the option `ignore` into a
// list of ignored files (all but the last one) instead of
if (program.args.length < 1) {
  const error = new ErrorReport('input', 'Missing path to project.')
  logger.report(error)
}

config.path = program.args.pop()

if (program.es7) config.withES7 = true
if (program.jsx) config.withJSX = true
if (program.ignore) {
  if (program.args.length > 0) {
    config.ignoreDirs = program.args
  } else {
    const error = new ErrorReport('input', 'ignore flag enabled but no paths provided.')
    logger.report(error)
  }
}

// Exit if there are errors.
if (logger.hasErrors(ErrorReport.symbol())) {
  logger.displayErrors()
  exit(1)
}

// Initalises the project.
try {
  const project = new Project(config, logger)
  project
    .analyse(DependenciesAnalyser)
    .analyse(ModulesAnalyser)
    // .analyse(CodeAnalyser)
    .execute()
} catch (e) {
  logger.displayErrors()
  exit(1)
}
