const { dirname, extname, isAbsolute, resolve } = require('path')
const { existsSync } = require('fs')

/**
 * Given a relative path as a string and the root of the project, resolves the
 * path to the module. In case it does not exist, it returns null.
 *
 * @param {string} value - Path to resolve.
 * @param {string} filePath - Path to the root of the project.
 * @param {boolean} withJSX - If we should allow `.jsx` extensions.
 * @return {string} Path to the module. Null if not found.
 */
function extractPath (value, filePath, withJSX) {
  const isAbsOrRel = (p) => ['.', '/'].includes(p.charAt(0))

  if (isAbsOrRel(value)) {
    let modulePath = value

    if (!isAbsolute(value)) {
      modulePath = resolve(dirname(filePath), value)
    }

    if (existsSync(modulePath)) {
      return modulePath
    } else if (extname(modulePath) === '') {
      if (existsSync(`${modulePath}.js`)) {
        return `${modulePath}.js`
      } else if (withJSX && existsSync(`${modulePath}.jsx`)) {
        return `${modulePath}.jsx`
      }
    }
  }
  return null
}

module.exports = {
  extractPath
}
