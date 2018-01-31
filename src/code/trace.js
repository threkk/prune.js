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
  constructor (statementNodes, remanent) {
    this._remanent = remanent || []
    this._statements = (statementNodes || []).map(node => parse(node))
    this._exported = filterExportNodes(this._statements)
    this._symbols = {}

    for (let statement of this._statements) {
      for (let ret of statement.returns) {
        this._symbols[ret] = statement
      }
    }
    console.log('symbols', Object.keys(this._symbols))
  }

  get exported () {
    return this._exported
  }

  get statements () {
    return this._statements
  }

  analyse () {
    // The nodes used by a module are those which are used by the exporter
    // function of the module recursively.
    // TODO: Check the used nodes in the table of symbols to get the extended
    // usage.
    const usedNodeIds = _.flatten(_.uniq(this.exported.map(e => e.uses)))

    // Our working statements are those from the context plus the ones that have
    // not been used from the previous context.
    const statements = this.statements.concat(this._remanent)

    // The not used nodes are those node which all returned values are not
    // contained in the used node ids or they are the exporter itself. The used
    // nodes are all others.
    const [notUsed, used] = _.partition(statements, statement =>
      // This might not be true if it is possible to modify a variable/content
      // of a variable in a referential way (C style).
      !statement.returns.reduce(
        (acc, ret) => acc || usedNodeIds.includes(ret),
        false
      ) &&
      !statement.isExporter
    )

    return {
      notUsed,
      used
    }
  }
}

module.exports = Trace
