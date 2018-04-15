/**
 * The scope is a list of nodes that are defined in the same executio
 * environment. These nodes share the symbol table and are executed from the
 * top to the bottom. When we analyse a scope, we determine which symbols are
 * not used by the scope or the children scopes.
 *
 * @param {Array} nodes - List of nodes to be added to the scope. Emtpy by
 * default.
 * @param {Object} parentScope - Table of symbols from the parent scope which
 * are relevant for the current scope. Emtpy by default.
 */
class Scope {
  constructor (nodes = [], parentScope = {}) {
    this.nodes = []
    this.symbols = {}
    this.usage = []
    this.childrenScope = {}
    this.types = {}

    nodes.forEach(node => this.node.push(node))

    // Merge the symbol table of the scope with the parent. Symbols defined in
    // the parent should be available in the children unless specified the
    // opposite (example, nested functions.
    //
    // function f () { functiong g() { /* No parent scope here */ }}
    if (parentScope !== null) {
      this.symbols = Object.assign(this.symbols, parentScope)
    }
  }

  /**
   * Given a statement node, registers it in the scope. Registering a statement
   * consist on analysing the AST nodes and listing them within the scope.
   *
   * @param {Statement} sttm - Statement to register.
   * @return {Number|null} ID of the node within the scope.
   */
  registerStatement (sttm) {
    if (!sttm.isType('statement')) {
      return null
    }

    const len = this.nodes.push(sttm)
    const newId = len - 1

    this.symbols[newId] = sttm.getSymbols()
    this.usage[newId] = sttm.getUsage()
    this.childrenScope[newId] = sttm.getChildren(this)

    const mainType = sttm.node.type
    if (typeof this.types[mainType] === 'undefined') {
      this.types[mainType] = []
    }

    this.types[mainType].push(newId)

    return newId
  }

  resolveExpression (expr) {
    if (!expr.isType('expression')) {
      return null
    }
  }

  resolveDeclaration (decl) {
    if (!decl.isType('declaration')) {
      return null
    }
  }

  registerSymbol (symbol, node) {
    this.symbols[symbol] = node
  }

  resolveSymbol (symbol) {
    return this.symbols[symbol]
  }

  registerUsage (symbol) {

  }

  findNotUsedNodes () {

  }
}

module.exports = Scope
