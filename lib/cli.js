#!/usr/bin/env node --harmony
const program = require('commander')
const chalk = require('chalk')
const { exit } = require('process')
const config = require('../package.json')

const Logger = require('./project/logger')
const Project = require('./project/project')

const DependenciesAnalyser = require('./dependencies/analyser')

let projectPath = null
let withES7 = false
let withJSX = false
let ignoreDirs = []

function ignoreAcc (val, acc) {
  acc.push(val)
  return acc
}

program
  .version(config.version)
  .description(config.description)
  .usage('[options] <path>')
  .option('-7, --es7', 'Adds ES7 support.')
  .option('-x, --jsx', 'Adds JSX syntax support.')
  .option('-i, --ignore [dir]', 'Excludes the selected folder', ignoreAcc, [])
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

if (program.es7) withES7 = true
if (program.jsx) withJSX = true
if (program.ignore.length > 0) ignoreDirs = program.ignore

const logger = new Logger()
const project = new Project(projectPath, logger)

const depAnalyser = new DependenciesAnalyser(ignoreDirs, withES7, withJSX)

project.analyse(depAnalyser)
