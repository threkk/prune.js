const walker = require('acorn-walk')
import { join } from 'path'
import { createASTParser, loadFile } from './ast'
const { inspect } = require('util')

const parser = createASTParser(false)
const path = join(
  process.cwd(),
  './examples/sample-webserver/simple-webserver.js'
)

loadFile(path)
  .then(parser)
  .then(ast => {
    walker.fullAncestor(ast, (...args) => {
      console.log(args)
    })
  })
  .catch(console.error)
