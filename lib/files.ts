import { PathLike, readFileSync, readdirSync, readSync } from 'fs'
import { join, resolve, posix, isAbsolute, extname } from 'path'

/**
 * Extracts all the file paths from the project. Valid files depend on the
 * configuration. `node_modules` and .gitignore are always ignored.
 */
export function extractFiles(
  root: string,
  ignored: string[],
  extensions: string[]
): PathLike[] {
  const ignoredItems = ignored.map((el) => {
    if (isAbsolute(el)) return el
    return resolve(join(root, el))
  })

  function extract(r: string): string[] {
    const items = []

    const dirs = readdirSync(r, { encoding: 'utf-8', withFileTypes: true })
    while (dirs != null && dirs.length > 0) {
      const peek = dirs.pop()
      const path = resolve(join(r, peek.name))
      // Skipping if ignored
      if (ignored.includes(path)) continue

      if (peek.isDirectory()) {
        items.push(...extract(path))
        // Extname includes a dot.
      } else if (extensions.includes(extname(path).substring(1))) {
        items.push(path)
      }
    }

    return items
  }
  return extract(root)
}

export function getPackageJson(root: string): any | null {
  const pkg = resolve(join(root, 'package.json'))
  try {
    const file = readFileSync(pkg, { encoding: 'utf-8' })
    return JSON.parse(file)
  } catch (e) {
    return null
  }
}
