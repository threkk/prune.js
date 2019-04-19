var walker = require('acorn-walk');
var createScope = require('./scope').createScope;
// Implements
function execute(ast) {
    // walker.ancestor(ast, {
    //   Statement (node, ancestor) {
    //     console.log(`Node: ${node.type}, antecesors: ${ancestor.map(n => n.type).join('>')}`)
    //   }
    // })
    walker.recursive(ast, {}, {
        Program: function (node, state, c) {
            node.body.map(function (n) { return c(n); });
        },
        BlockStatement: function (node, state, c) {
            node.body.map(function (n) { return c(n); });
        },
        FunctionDeclaration: function (node, state, c) {
            console.log(node);
        },
        Statement: function (node) {
            // console.log(`Node: ${node.type}`)
        }
    });
    // createScope(ast)
}
module.exports = {
    execute: execute
};
