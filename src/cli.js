#!/usr/bin/env node --harmony
const pkg = require('../package.json')
const program = require('commander')
const { resolve } = require('path')

const Logger = require('./project/logger')
const Project = require('./project/project')

// Sets the CLI.
program
  .version(pkg.version)
  .description(pkg.description)
  .usage('[options]')
  .option('-p, --path <root>', 'path to execute prunejs', process.cwd())
  .option('-x, --jsx', 'enables JSX syntax support')
  .option('-i, --ignore <paths>', 'excludes the following folders', (val) => val.split(','), ['node_modules'])
  .parse(process.argv)

const { jsx, path, ignore } = program
const noColor = Boolean(process.env.NO_COLOR) || false

// Initialise the configuration.
const config = {
  root: path,
  ignore: [...new Set(['node_modules', ...ignore])].map(route => resolve(path, route)),
  jsx: !!jsx,
  logger: new Logger(noColor),
  noColor
}

const project = new Project(config)
project.analyse()
