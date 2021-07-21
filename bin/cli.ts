#!/usr/bin/env node
import Project from '../lib/project'
import DeadCode from '../lib/dead-code'
import { resolve, join, isAbsolute } from 'path'

const [cmd, root, ...entryPoints] = process.argv.slice(2)

switch (cmd) {
  case 'dead-code':
    deadCode(root, entryPoints)
    break
  case 'project':
    project(root)
    break
  case 'load':
    loadConfig(root)
    break
  case 'file':
    const [file, ..._] = entryPoints
    graph(root, file)
    break
  default:
    console.log('Commands: dead-code, file, load, projects')
}

function deadCode(
  root: string,
  entryPoints: string[],
  ignore: string[] = [],
  isLibrary: boolean = false
): void {
  const project = new Project({ root, ignore, isLibrary })
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
  const dependencies = deadCode.getDeadDependencies()
  console.log('=> Dependencies', dependencies.length, dependencies)

  const modules = deadCode.getDeadModules().map((d) => d.path)
  console.log('=> Modules', modules.length, modules)

  const statements = deadCode.getDeadStatements().map((d) => d.toString())
  console.log('=> Vertices', statements.length, statements)
}

function project(root: string): void {
  const project = new Project({
    root,
    ignore: ['dist.js', './test', 'bechmark.js', './media', './examples'],
  })
  console.log(project.toString())
}

function graph(root: string, file: string): void {
  const path = resolve(join(process.cwd(), file))
  const project = new Project({ root, ignore: ['dist.js'] })
  const source = project.files[path]
  if (source) console.log(source.graph.toString())
  else console.log(`${path} not found`)
}

interface ConfigProps {
  root: string
  entryPoints: string[]
  ignore?: string[]
  isLibrary?: boolean
}

function loadConfig(path: string): void {
  const configRoot = resolve(join(process.cwd(), path))
  import(configRoot)
    .then((config: ConfigProps) => {
      const root: string = isAbsolute(config.root)
        ? config.root
        : resolve(join(configRoot, config.root))

      const ignore: string[] = (config.ignore ?? []).map((i) =>
        isAbsolute(i) ? i : resolve(join(root, i))
      )
      const entryPoints: string[] = config.entryPoints.map((e) =>
        isAbsolute(e) ? e : resolve(join(root, e))
      )

      const isLibrary: boolean = config.isLibrary ?? false
      deadCode(root, entryPoints, ignore, isLibrary)
    })
    .catch((e) => {
      console.error(`Configuration load failed: ${e.message}`)
      console.error(e)
    })
}
