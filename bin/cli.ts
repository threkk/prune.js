#!/usr/bin/env node --harmony
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import Files from '../lib/project/files'
import log from '../lib/project/logger'
import Project, { Config } from '../lib/project/project'

const pkg: any = JSON.parse(readFileSync('../../package.json', 'utf-8'))

// const Deps = require('../lib/dependencies/analyser')

const program = new Command()

// Sets the CLI.
program
  .version(pkg.version)
  .description(pkg.description)
  .usage('[options]')
  .option('-p, --path <root>', 'path to execute prunejs', process.cwd())
  .option('-x, --jsx', 'enables JSX syntax support')
  .option(
    '-i, --ignore <paths>',
    'excludes the following folders',
    (val: string) => val.split(','),
    ['node_modules']
  )
  .parse(process.argv)

const { jsx, path, ignore } = program

// Initialise the configuration.
const config: Config = {
  root: path,
  ignore: [...new Set(['node_modules', ...ignore])].map(route =>
    resolve(path, route)
  ),
  jsx: !!jsx
}

const run = async () => {
  const project = new Project(config)
  // await project.analyse(Deps)
  await project.analyse(Files)
  log.display()
}

try {
  run()
} catch (e) {
  console.log(e)
}
