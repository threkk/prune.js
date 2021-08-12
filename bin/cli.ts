#!/usr/bin/env node
import Project from '../lib/project'
import DeadCode from '../lib/dead-code'
import { resolve, join, isAbsolute } from 'path'

const [cmd, configPath, file] = process.argv.slice(2)

interface ConfigProps {
  root: string
  entryPoints: string[]
  ignore?: string[]
  isLibrary?: boolean
}

const configRoot = resolve(join(process.cwd(), configPath))
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

    switch (cmd) {
      case 'dead-code':
        deadCode({ root, ignore, entryPoints, isLibrary })
        break
      case 'project-graph':
        project({ root, ignore, entryPoints, isLibrary })
        break
      case 'file-graph':
        graph({ root, ignore, entryPoints, isLibrary }, file)
        break
      default:
        console.log('Commands: dead-code, file-graph, project-graph')
    }
  })
  .catch((e) => {
    console.error(`Configuration load failed: ${e.message}`)
    console.error(e)
  })

function deadCode(props: ConfigProps): void {
  const project = new Project(props)
  const deadCode = new DeadCode(project)
  for (const entryPoint of props.entryPoints) {
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

  const statements = deadCode
    .getDeadStatements()
    .map((d) => d.toString().slice(1, -1))
  console.log('=> Statements', statements.length, statements)
}

function project(props: ConfigProps): void {
  const project = new Project(props)
  console.log(project.toString())
}

function graph(props: ConfigProps, file: string): void {
  const path = isAbsolute(file) ? file : resolve(join(process.cwd(), file))
  const project = new Project(props)
  const source = project.files[path]
  if (source) console.log(source.graph.toString())
  else console.log(`${path} not found`)
}
