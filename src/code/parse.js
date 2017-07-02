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

  const {
    Super,
    Import,
    ThisExpression,
    ArrowFunctionExpression,
    YieldExpression,
    AwaitExpression,
    ArrayExpression,
    ObjectExpression,
    ObjectMember,
    ObjectProperty,
    ObjectMethod,
    FunctionExpression,
    UnaryExpression,
    UnaryOperator,
    UpdateExpression,
    UpdateOperator,
    BinaryExpression,
    BinaryOperator,
    AssignmentExpression,
    AssignmentOperator,
    LogicalExpression,
    LogicalOperator,
    SpreadElement,
    MemberExpression,
    BindExpression,
    ConditionalExpression,
    CallExpression,
    NewExpression,
    SequenceExpression,
    DoExpression
  } = require('./expression')

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

      // expression.js
    case 'Super':
      return new Super(node)
    case 'Import':
      return new Import(node)
    case 'ThisExpression':
      return new ThisExpression(node)
    case 'ArrowFunctionExpression':
      return new ArrowFunctionExpression(node)
    case 'YieldExpression':
      return new YieldExpression(node)
    case 'AwaitExpression':
      return new AwaitExpression(node)
    case 'ArrayExpression':
      return new ArrayExpression(node)
    case 'ObjectExpression':
      return new ObjectExpression(node)
    case 'ObjectMember':
      return new ObjectMember(node)
    case 'ObjectProperty':
      return new ObjectProperty(node)
    case 'ObjectMethod':
      return new ObjectMethod(node)
    case 'FunctionExpression':
      return new FunctionExpression(node)
    case 'UnaryExpression':
      return new UnaryExpression(node)
    case 'UnaryOperator':
      return new UnaryOperator(node)
    case 'UpdateExpression':
      return new UpdateExpression(node)
    case 'UpdateOperator':
      return new UpdateOperator(node)
    case 'BinaryExpression':
      return new BinaryExpression(node)
    case 'BinaryOperator':
      return new BinaryOperator(node)
    case 'AssignmentExpression':
      return new AssignmentExpression(node)
    case 'AssignmentOperator':
      return new AssignmentOperator(node)
    case 'LogicalExpression':
      return new LogicalExpression(node)
    case 'LogicalOperator':
      return new LogicalOperator(node)
    case 'SpreadElement':
      return new SpreadElement(node)
    case 'MemberExpression':
      return new MemberExpression(node)
    case 'BindExpression':
      return new BindExpression(node)
    case 'ConditionalExpression':
      return new ConditionalExpression(node)
    case 'CallExpression':
      return new CallExpression(node)
    case 'NewExpression':
      return new NewExpression(node)
    case 'SequenceExpression':
      return new SequenceExpression(node)
    case 'DoExpression':
      return new DoExpression(node)

    default:
      throw TypeError(`Unknown node:  ${node}`)
  }
}

module.exports = parse
