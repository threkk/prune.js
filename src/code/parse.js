const {
  Class,
  ClassBody,
  ClassMethod,
  ClassProperty,
  ClassPrivateProperty,
  ClassDeclaration,
  ClassExpression,
  MetaProperty
} = require('./class')

function parse (node) {
  switch (node.type) {
    case Class:
      return new Class(node)
    case ClassBody:
      return new ClassBody(node)
    case ClassMethod:
      return new ClassMethod(node)
    case ClassProperty:
      return new ClassProperty(node)
    case ClassPrivateProperty:
      return new ClassPrivateProperty(node)
    case ClassDeclaration:
      return new ClassDeclaration(node)
    case ClassExpression:
      return new ClassExpression(node)
    case MetaProperty:
      return new MetaProperty(node)
  }
}

module.exports = parse
