#!/usr/bin/env node --harmony
const chalk = require('chalk')
const config = require('../package.json')
const program = require('commander')
const { exit } = require('process')

const Logger = require('./project/logger')
const Project = require('./project/project')

const DependenciesAnalyser = require('./dependencies/analyser')

let projectPath = null

let ignoreDirs = []
let withES7 = false
let withJSX = false

function ignoreAcc (val, acc) {
  acc.push(val)
  return acc
}

// Sets the CLI.
program
  .version(config.version)
  .description(config.description)
  .usage('[options] <path>')
  .option('-i, --ignore [dir]', 'Excludes the selected folder', ignoreAcc, [])
  .option('-x, --jsx', 'Adds JSX syntax support.')
  .option('-7, --es7', 'Adds ES7 support.')
  .arguments('<path>')
  .action((p) => {
    const isValid = Project.isValidPath(p)
    if (isValid.valid) {
      projectPath = p
    } else {
      console.error(chalk.red(isValid.error))
      exit(1)
    }
  })
  .parse(process.argv)

// Extracts the configuration.
if (program.es7) withES7 = true
if (program.jsx) withJSX = true
if (program.ignore.length > 0) ignoreDirs = program.ignore

// Initalises the project and logger.
const logger = new Logger()
const project = new Project(projectPath, logger)

// Initialises the analysers.
const depAnalyser = new DependenciesAnalyser(ignoreDirs, withES7, withJSX)

project
  .analyse(depAnalyser)
  .execute()
