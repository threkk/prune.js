import { PathLike } from 'fs'
import globby from 'globby'
import { join, resolve } from 'path'

/**
 * Extracts all the file paths from the project. Valid files depend on the
 * configuration. `node_modules` and .gitignore are always ignored.
 */
export default async function extractFiles(
  path: string,
  ignored: string[],
  extensions: string[]
): Promise<PathLike[]> {
  // Paths to filter in the format: !(p1|p2|...)
  const pathsToFilter: string[] = ['**/node_modules/**']
  pathsToFilter.push(...ignored)
  const filterExpr: string = `!(${pathsToFilter.join('|')})`

  // Any file with a valid expression: **/*.ext
  const matchExprs: string[] = extensions.map(e => `**/*.${e}`)
  matchExprs.push(filterExpr)

  const matches: string[] = await globby(matchExprs, { gitignore: true })
  return matches.map(m => resolve(join(path, m)))
}
