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
let config = null

// Initialise the logger.
const logger = new Logger()

function ignoreAcc (val, acc) {
  acc.push(val)
  return acc
}

// Sets the CLI.
program
  .version(pkg.version)
  .description(pkg.description)
  .usage('[options] <path>')
  .option('-i, --ignore [dir]', 'Excludes the selected folder. `node_modules` are always ignored.', ignoreAcc, [])
  .option('-x, --jsx', 'Adds JSX syntax support.')
  .option('-7, --es7', 'Adds ES7 support.')
  .arguments('<path>')
  .action((p) => {
    const isValid = Project.isValidPath(p)
    if (isValid.valid) {
      config = new Config(p)
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

if (program.ignore.length > 0) {
  for (let dir of program.ignore) {
    config.ignoreDirs = dir
  }
}

// Initalises the project.
const project = new Project(config, logger)

project
  .analyse(DependenciesAnalyser)
  .analyse(ModulesAnalyser)
  .execute()
