#!/usr/bin/env node --harmony
const chalk = require('chalk')
const pkg = require('../package.json')
const program = require('commander')
const _ = require('underscore')
const { exit } = require('process')
const { resolve } = require('path')

const Logger = require('./project/logger')
const Project = require('./project/project')

const DependenciesAnalyser = require('./dependencies/analyser')

// Default configuration.
const config = {
  path: resolve('.'),
  ignoreDirs: [],
  withES7: false,
  withJSX: false
}

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
      config.path = resolve(p)
    } else {
      console.error(chalk.red(isValid.error))
      exit(1)
    }
  })
  .parse(process.argv)

// Extracts the configuration.
if (program.es7) config.withES7 = true
if (program.jsx) config.withJSX = true
if (program.ignore.length > 0) {
  config.ignoreDirs = _.map(program.ignore, (dir) => resolve(config.path, dir))
}

// We always ignore the node_modules.
config.ignoreDirs.push(resolve(config.path, './node_modules'))
// unique elements only in the array?

// Initalises the project and logger.
const logger = new Logger()
const project = new Project(config, logger)

project
  .analyse(DependenciesAnalyser)
  .execute()
