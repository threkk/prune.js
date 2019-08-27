#! /usr/bin/env node

import { resolve, join } from 'path'
import { readdirSync } from 'fs'
import Project from '../lib/project'
import { inspect } from 'util'

// FIXME: Change for a parameterised path.
const basePath: string = resolve(join(__dirname, '../../test/validation/'))

const validationProjects = readdirSync(basePath, {
  withFileTypes: true
})
  .map(dir => resolve(join(basePath, dir.name)))
  .reduce((prev, curr) => {
    const project = new Project(curr)
    prev[curr] = project.init().generateGraphs()
    return prev
  }, {})

Object.entries(validationProjects).forEach(([route, project]) =>
  console.info(route, inspect(project, { depth: 4, colors: true }))
)
