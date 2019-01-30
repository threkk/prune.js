const walker = require('acorn-walk')

// Implements
function statement (ast) {
  walker.simple(ast, {
    // Statement (node) {
    //   console.log(node.type)
    // },
    FunctionDeclaration (node) {
      console.log(`Function declaration: ${node.id.name}`)
    },
    VariableDeclaration (node) {
      node.declarations.forEach(declarator =>
        console.log(`Variable declaration: ${node.kind}`, declarator.id))
    }
  })
}

module.exports = statement
