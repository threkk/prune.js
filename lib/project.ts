import { PathLike, lstatSync } from 'fs'
import { extractFiles, getPackageJson } from './files'
import { resolve, join, extname } from 'path'
import { buildGraph } from './builder'
import { Graph } from './graph'

export default class Project {
  private root: string
  private paths: PathLike[]
  private ignore: string[]
  private dependencies: string[]
  private entryPoints: string[]

  constructor(root: string, ignore?: string[]) {
    this.root = root
    this.ignore = ignore ?? []
    this.paths = []
    this.dependencies = []
    this.entryPoints = []

    // This method works with both single files and folders
    const stats = lstatSync(this.root)

    // If it is single file, this is the only entry point.
    if (stats.isFile() && extname(this.root) === '.js') {
      this.entryPoints.push(this.root)
      this.paths.push(this.root)
    }

    // If it is a directory, we have some more options.
    if (stats.isDirectory()) {
      // Search for a package.json and populate dependencies and entry points
      // with the contents of bin and main.
      const pkg = getPackageJson(this.root)
      if (pkg?.dependencies != null)
        this.dependencies.push(...Object.keys(pkg.dependencies))

      if (pkg?.bin != null)
        this.entryPoints.push(
          ...Object.values(pkg.bin as { [key: string]: string }).map(entry =>
            resolve(join(this.root, entry))
          )
        )

      if (pkg?.main != null)
        this.entryPoints.push(resolve(join(this.root, pkg.main)))

      // Retrieve all files
      const files = extractFiles(this.root, this.ignore, ['js'])
      this.paths.push(...files.map(f => f as string))
    }
  }

  public generateGraphs(): Graph[] {
    return this.paths.map(p => buildGraph(p))
  }
}
