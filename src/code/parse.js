function parse (node) {
  // Decorator, Directive and DirectiveLiteral are not covered.
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

  const {
    FunctionDeclaration,
    VariableDeclaration,
    VariableDeclarator,
    AssignmentProperty,
    ObjectPattern,
    ArrayPattern,
    RestElement,
    AssignmentPattern
  } = require('./declaration')

  const {
    ExpressionStatement,
    BlockStatement,
    EmptyStatement,
    DebuggerStatement,
    WithStatement,
    ReturnStatement,
    LabeledStatement,
    BreakStatement,
    ContinueStatement,
    IfStatement,
    SwitchStatement,
    SwitchCase,
    ThrowStatement,
    TryStatement,
    CatchClause,
    WhileStatement,
    DoWhileStatement,
    ForStatement,
    ForInStatement,
    ForOfStatement
  } = require('./statement')

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

      // declaration.js
    case 'FunctionDeclaration':
      return new FunctionDeclaration(node)
    case 'VariableDeclaration':
      return new VariableDeclaration(node)
    case 'VariableDeclarator':
      return new VariableDeclarator(node)
    case 'AssignmentProperty':
      return new AssignmentProperty(node)
    case 'ObjectPattern':
      return new ObjectPattern(node)
    case 'ArrayPattern':
      return new ArrayPattern(node)
    case 'RestElement':
      return new RestElement(node)
    case 'AssignmentPattern':
      return new AssignmentPattern(node)

      // statement.js
    case 'ExpressionStatement':
      return new ExpressionStatement(node)
    case 'BlockStatement':
      return new BlockStatement(node)
    case 'EmptyStatement':
      return new EmptyStatement(node)
    case 'DebuggerStatement':
      return new DebuggerStatement(node)
    case 'WithStatement':
      return new WithStatement(node)
    case 'ReturnStatement':
      return new ReturnStatement(node)
    case 'LabeledStatement':
      return new LabeledStatement(node)
    case 'BreakStatement':
      return new BreakStatement(node)
    case 'ContinueStatement':
      return new ContinueStatement(node)
    case 'IfStatement':
      return new IfStatement(node)
    case 'SwitchStatement':
      return new SwitchStatement(node)
    case 'SwitchCase':
      return new SwitchCase(node)
    case 'ThrowStatement':
      return new ThrowStatement(node)
    case 'TryStatement':
      return new TryStatement(node)
    case 'CatchClause':
      return new CatchClause(node)
    case 'WhileStatement':
      return new WhileStatement(node)
    case 'DoWhileStatement':
      return new DoWhileStatement(node)
    case 'ForStatement':
      return new ForStatement(node)
    case 'ForInStatement':
      return new ForInStatement(node)
    case 'ForOfStatement':
      return new ForOfStatement(node)

    default:
      throw TypeError(`Unknown node:  ${node}`)
  }
}

module.exports = parse
