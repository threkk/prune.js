import fs, { PathLike } from 'fs'
import { extname, resolve } from 'path'
import { promisify } from 'util'
import log from './logger'

const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

// Windows? ¯\_(ツ)_/¯
const isHidden: (file: PathLike) => boolean = file =>
  (file as string).charAt(0) === '.'
const validExtension: (
  extensions: string[]
) => (file: PathLike) => boolean = extensions => file =>
  extensions.includes(extname(file as string))
const ignoreDirs: (
  dirs: PathLike[]
) => (file: PathLike) => boolean = dirs => file => dirs.includes(file as string)

/**
 * Extracts all the file paths from the project. Valid files depend on the
 * configuration. `node_modules` are always ignored.
 */
export default async function extractFiles(
  path: PathLike,
  ignored: PathLike[],
  extensions: string[]
): Promise<PathLike[]> {
  const dirs: PathLike[] = [path]
  const files: string[] = []

  const isIgnored = ignoreDirs(ignored)
  const isValidExtension = validExtension(extensions)

  // While we have directories to check.
  while (dirs.length > 0) {
    // Get the last one.
    const dir: PathLike = dirs.pop()
    try {
      // Get all the elements in the directory.
      const items: string[] = await readdir(dir)

      // Resolve the paths and filter ignore or hidden elements.
      const visibleItems: string[] = items
        .map(item => resolve(dir as string, item))
        .filter(item => !isIgnored(item) && !isHidden(item))

      // If it is a directory, add it to the list to check.
      // If it is a file, add it to the resolved paths.
      for (const itemPath of visibleItems) {
        try {
          const stats = await stat(itemPath)
          if (stats.isDirectory()) {
            dirs.push(itemPath)
          } else if (isValidExtension(itemPath)) {
            files.push(itemPath)
          }
        } catch (e) {
          log.exception(e)
        }
      }
    } catch (e) {
      log.exception(e)
    }
  }
  return files
}
