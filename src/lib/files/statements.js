const walker = require('acorn-walk')
const { createScope } = require('./scope')

// Implements
function execute (ast) {
  // walker.ancestor(ast, {
  //   Statement (node, ancestor) {
  //     console.log(`Node: ${node.type}, antecesors: ${ancestor.map(n => n.type).join('>')}`)
  //   }
  // })
  walker.recursive(ast, {}, {
    Program (node, state, c) {
      node.body.map(n => c(n))
    },
    BlockStatement(node,state, c) {
      node.body.map(n => c(n))
    },
    FunctionDeclaration(node, state, c) {
      console.log(node)
    },
    Statement (node) {
      // console.log(`Node: ${node.type}`)
    }
  })
  // createScope(ast)
}

module.exports = {
  execute
}
