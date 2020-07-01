import { resolve, join } from 'path'
import { readFileSync, PathLike } from 'fs'
import { ScopeManager, analyze } from 'eslint-scope'
import * as estree from 'estree'

// @ts-ignore TS7016
import { Options, parse } from 'espree'

import { Graph } from './graph'
import { GraphBuilder } from './builder'

export interface FileContent {
  path: PathLike
  content: string
}

export class FileScanner {
  #path: Readonly<PathLike>
  #sm: Readonly<ScopeManager>
  #ast: Readonly<estree.Node>
  #graph: Graph

  constructor(path: PathLike, jsx: boolean = false) {
    this.#path = path
    this.#graph = null

    const content: string = readFileSync(this.#path as PathLike, 'utf-8')
    const options: Options = {
      sourceType: 'module', // Enables the import/export statements.
      loc: true, // Enables locations.a
      range: true, // Add ranges to the nodes [node.start, node.end]
      ecmaVersion: 10,
      allowHashBang: true,
      locations: true,
      ecmaFeatures: {
        jsx,
        globalReturn: true
      }
    }

    this.#ast = parse(content, options)
    this.#sm = analyze(this.#ast, {
      ecmaVersion: 10, // Matching versions.
      ignoreEval: true, // Could be enabled if considered.
      sourceType: 'module' // ES6 support
    })
  }

  build() {
    const gb = new GraphBuilder(this.#ast, this.#sm)
    this.#graph = gb
      .generateVertices()
      .addReadWriteRelantionships()
      .linkCallParameters()
      .getGraph()
    console.log(this.#graph.toString())
  }
}

const file = resolve(
  // join(process.cwd(), './test/validation/03-nested-scopes-invalid.js')
  join(process.cwd(), './test/validation/04-function-call-valid.js')
  // join(process.cwd(), './test/validation/05-control-flow-valid.js')
)
const fs = new FileScanner(file)
fs.build()
