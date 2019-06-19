import { join } from 'path'
import { createASTParser, loadFile } from './ast'
import { extractStatements } from './visitor/statements'

const parser = createASTParser(false)
const path = join(
  process.cwd(),
  './examples/sample-webserver/simple-webserver.js'
)

loadFile(path)
  .then(parser)
  .then(extractStatements)
  .then(statements => {
    statements.forEach(st => {
      console.log(`Node: ${st.type} at ${st.loc.start.line}`)
    })
  })
  .catch(console.error)
