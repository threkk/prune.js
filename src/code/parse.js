function parse (node) {
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

  const {
    Identifier,
    PrivateName,
    Literal,
    RegExpLiteral,
    NullLiteral,
    StringLiteral,
    BooleanLiteral,
    NumericLiteral,
    TemplateLiteral,
    TaggedTemplateExpression,
    TemplateElement
  } = require('./literal')

  switch (node.type) {
    // class.js
    case 'Class':
      return new Class(node)
    case 'ClassBody':
      return new ClassBody(node)
    case 'ClassMethod':
      return new ClassMethod(node)
    case 'ClassProperty':
      return new ClassProperty(node)
    case 'ClassPrivateProperty':
      return new ClassPrivateProperty(node)
    case 'ClassDeclaration':
      return new ClassDeclaration(node)
    case 'ClassExpression':
      return new ClassExpression(node)
    case 'MetaProperty':
      return new MetaProperty(node)

    // literal.js
    case 'Identifier':
      return new Identifier(node)
    case 'PrivateName':
      return new PrivateName(node)
    case 'Literal':
      return new Literal(node)
    case 'RegExpLiteral':
      return new RegExpLiteral(node)
    case 'NullLiteral':
      return new NullLiteral(node)
    case 'StringLiteral':
      return new StringLiteral(node)
    case 'BooleanLiteral':
      return new BooleanLiteral(node)
    case 'NumericLiteral':
      return new NumericLiteral(node)
    case 'TemplateLiteral':
      return new TemplateLiteral(node)
    case 'TaggedTemplateExpression':
      return new TaggedTemplateExpression(node)
    case 'TemplateElement':
      return new TemplateElement(node)
  }
}

module.exports = parse
