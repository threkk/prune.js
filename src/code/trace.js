const parse = require('./parser')
const _ = require('underscore')

const ENDexports = (element) => {
  const isNotNullDeclaration = element.declaration != null
  const isNotNullSource = element.source != null
  const isNotEmptySpecifier =
    element.specifiers != null &&
    Array.isArray(element.specifiers) &&
    element.specifiers.length > 0

  if (isNotNullDeclaration && (isNotNullSource || isNotEmptySpecifier)) {
    const file = element.loc.filename
    const start = element.loc.start
    const end = element.loc.end

    throw Error(`Invalid state detected at: ${file}:${start},${end}`)
  } else if (isNotNullDeclaration) {
    return element.declaration
  } else if (isNotEmptySpecifier) {
    return element.specifiers
  } else {
    return null
  }
}

const filterExportNodes = arr => (_.flatten(
  arr.map((element) => {
    // A special complex case.
    if (element.type === 'ExportNamedDeclaration') {
      return ENDexports(element)
    }

    if (element.isExporter) {
      return element
    }
  })
  .filter(element => element != null)
))

class Trace {
  constructor (filePath, statementNodes, remaining) {
    this._filePath = filePath
    this._remaining = remaining || []
    this._statements = (statementNodes || []).map(node => parse(node))
    this._exported = filterExportNodes(this._statements)
  }

  get path () {
    return this._filePath
  }

  get exported () {
    return this._exported
  }

  get statements () {
    return this._statements
  }

  // Add extra context?
  analyse () {
    const usedNodes = _.flatten(this.exported.map(e => e.uses))
    // FIRST LEVEL :D
    const statements = this.statements.concat(this._remaining)
    const notUsedNodes = statements.filter(statement =>
      !statement.returns.reduce(
        (acc, ret) => acc || usedNodes.includes(ret),
        false
      ) &&
      !statement.isExporter
    )
    return notUsedNodes
  }
}

module.exports = Trace
