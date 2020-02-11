#!/usr/bin/env node --harmony
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg: any = JSON.parse(readFileSync('../../package.json', 'utf-8'))

// const Deps = require('../lib/dependencies/analyser')
// TODO: Add support to the $NO_COLOR variable.
const program = new Command()

// Sets the CLI.
program
  .version(pkg.version)
  .description(pkg.description)
  .usage('[options]')
  .option('-p, --path <root>', 'path to execute prunejs', process.cwd())
  .option(
    '-i, --ignore <paths>',
    'excludes the following folders',
    (val: string) => val.split(','),
    ['node_modules', '.git']
  )
  .parse(process.argv)

const { path, ignore } = program

// Initialise the configuration.
const config = {
  root: path,
  ignore: [...new Set([...ignore])].map(route => resolve(path, route))
}
