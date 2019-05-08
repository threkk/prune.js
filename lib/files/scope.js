const walker = require('acorn-walk')

/**
 * The BodyScope defines the variables available in current body scope. This
 * body scope can be a function scope or a block scope depending on the node.
 * This is relvant given that the behaviour changes depending if it is a
 * function or a block.
 *
 * If it is a function scope:
 * - The previous local variables are now considered global.
 * - The local and block environment are clear.
 * - Variables declared with var are local and hoisted.
 *
 * If it is a block scope:
 * - The previous local variables are still local.
 * - The previous block variable are now local, block environment is clear.
 *  - Variables declared with var are global and hoisted.
 */
class BodyScope {
  constructor ({ glob = {}, local = {}, block = {} } = {}) {
    this.glob = Object.assign({}, glob)
    this.local = Object.assign({}, local)
    this.block = Object.assign({}, block)
  }

  /**
   *
   *
   * @param {Node} ast: Input node to use to populate the context.
   */
  populate (ast) {
    const self = this
    walker.simple(ast, {
      FunctionDeclaration (node) {
        const id = node.id.name
        self.local[id] = { node, id, type: 'function' }
      },

      VariableDeclaration (node) {
        const kind = node.kind
        node.declarations.forEach(declarator => {
          walker.simple(declarator, {
            Identifier (node) {
              const id = node.name
              self.local[id] = { node, id, type: kind }
            }
          })

          // Filter those nodes whose ancestors contain the right part of
          // a AssignmentPatter.
          walker.simple(declarator, {
            AssignmentPattern (node) {
              const { right } = node
              walker.simple(right, {
                Identifier (node) {
                  const id = node.name
                  if (self.local[id]) {
                    delete self.local[id]
                  }
                }
              })
            }
          })
        })
      }
    })
  }
}

class BlockScope extends BodyScope {
  constructor ({ glob = {}, local = {}, block = {} } = {}) {
    super({ glob, local, block })
    this.glob = Object.assign({}, glob)
    this.local = Object.assign({}, local, block)
    this.block = {}
    this.populate.bind(this)
  }
}

class FunctionScope extends BodyScope {
  constructor ({ glob = {}, local = {}, block = {} } = {}) {
    super({ glob, local, block })
    this.glob = Object.assign({}, glob, local)
    this.local = {}
    this.block = {}
    this.populate.bind(this)
  }
}

function createScope (type = 'block', { glob = {}, local = {}, block = {} } = {}) {
  if (type === 'block') {
    return new BlockScope({ glob, local, block })
  } else if (type === 'function') {
    return new FunctionScope({ glob, local, block })
  } else {
    throw new Error('invalid parameter')
  }
}

module.exports = {
  createScope,
  BlockScope,
  FunctionScope
}
