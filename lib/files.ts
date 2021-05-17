import { accessSync, readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve, isAbsolute, extname } from 'path'
import { F_OK, R_OK } from 'constants'

/**
 * Extracts all the file paths from the project. Valid files depend on the
 * configuration. `node_modules` and .gitignore are always ignored.
 */
export function extractFiles(
  root: string,
  {
    ignored = ['.git', 'node_modules'],
    extensions = ['js'],
    followSymlinks = false,
  }: {
    ignored?: string[]
    extensions?: string[]
    followSymlinks?: boolean
  }
): string[] {
  // If the path is a file, we are done.
  if (statSync(root).isFile()) {
    if (ignored.includes(root)) return []
    return [root]
  }

  // For every path we need to generated the ignored paths.
  const ignoredItemsInFolder = (path) =>
    ignored.map((el) => {
      if (isAbsolute(el)) return el
      return resolve(join(path, el))
    })

  function listDir(localRoot: string): string[] {
    const items = []
    const dirs = readdirSync(localRoot, {
      encoding: 'utf-8',
      withFileTypes: true,
    })

    const ignored = ignoredItemsInFolder(localRoot)
    while (dirs != null && dirs.length > 0) {
      const peek = dirs.pop()
      const path = resolve(join(localRoot, peek.name))

      // Skipping if ignored
      if (ignored.includes(path)) continue

      try {
        accessSync(path, F_OK | R_OK)
      } catch {
        continue
      }

      if (!followSymlinks && peek.isSymbolicLink()) continue
      if (peek.isDirectory()) {
        items.push(...listDir(path))
        // Extname includes a dot.
      } else if (
        extensions.length === 0 ||
        extensions.includes(extname(path).substring(1))
      ) {
        items.push(path)
      }
    }
    return items
  }
  return listDir(root)
}

export function getDependenciesFromPackage(root: string): string[] {
  const pkg = resolve(join(root, 'package.json'))
  try {
    const file = readFileSync(pkg, { encoding: 'utf-8' })
    const json = JSON.parse(file)

    if (json && json.dependencies) {
      return Object.keys(json.dependencies)
    }
  } catch {}
  return []
}
