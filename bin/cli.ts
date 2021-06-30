#!/usr/bin/env node
import Project from '../lib/project'
import DeadCode from '../lib/dead-code'

const [root, ...entryPoints] = process.argv.slice(2)

const project = new Project({ root })
const deadCode = new DeadCode(project)
for (const entryPoint of entryPoints) {
  deadCode.createSubgraph(entryPoint)
}
console.log(
  'dead code'
    .toUpperCase()
    .split('')
    .map((c) => ` ${c}`)
    .join('')
)
console.log('=> Dependencies', deadCode.getDeadDependencies())
console.log(
  '=> Modules',
  deadCode.getDeadModules().map((d) => d.path)
)

console.log(
  '=> Vertices',
  deadCode.getDeadStatements().map((d) => d.toString())
)

// for (const [path, file] of Object.entries(project.files)) {
//   if (path.endsWith('diff.js')) {
//     console.log(file.graph.toString())
//   }
// }
