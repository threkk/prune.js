const fs = require('fs')

const { extname, resolve } = require('path')
const { promisify } = require('util')
const { all } = Promise

const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

// Windows? ¯\_(ツ)_/¯
const isHidden = (file) => file.charAt(0) === '.'
const validExtension = (extensions) => (file) => extensions.includes(extname(file))
const ignoreDirs = (dirs) => (file) => dirs.includes(file)

/**
 * Extracts all the file paths from the project. Valid files depend on the
 * configuration. `node_modules` are always ignored.
 */
async function extractFiles (path, ignored, extensions) {
  const dirs = [path]
  const files = []

  const isIgnored = ignoreDirs(ignored)
  const isValidExtension = validExtension(extensions)

  // While we have directories to check.
  while (dirs.length > 0) {
    // Get the last one.
    const dir = dirs.pop()
    try {
      // Get all the elements in the directory.
      const items = await readdir(dir)

      // Filter ignore or hidden elements and resolve the paths.
      const visibleItems = items
        .filter(item => !isIgnored(item) && !isHidden(item))
        .map(item => resolve(dir, item))

      // If it is a directory, add it to the list to check.
      // If it is a file, add it to the resolved paths.
      await all(visibleItems.forEach(async itemPath => {
        try {
          const stats = await stat(itemPath)
          if (stats.isDirectory()) {
            dirs.push(itemPath)
          } else if (isValidExtension(itemPath)) {
            files.push(itemPath)
          }
        } catch (e) {
          // Do smth
        }
      }))
    } catch (e) {
      // Do smth
    }
  }
  return files
}

module.exports = extractFiles
