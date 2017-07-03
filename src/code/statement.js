const AbstractNode = require('../abstract/node')
const parse = require('./parse')

function parseFlow (node) {
  const id = []
  const type = {
    main: 'flow',
    sub: node.type
  }
  const loc = node.loc
  let declares = []
  let uses = []
  const children = []

  switch (node.tye) {
    case 'ReturnStatement':
      if (node.argument != null) {
        uses = uses.concat(parse(node.argument).uses)
      }
      break
    case 'LabeledStatement':
      declares = declares.concat(parse(node.label).id)
      children.push(node.body)
      break
    case 'BreakStatement':
    case 'ContinueStatement':
      if (node.label != null) {
        uses = uses.concat(parse(node.label).uses)
      }
      break
    case 'IfStatement':
      uses = uses.concat(parse(node.test).uses)
      children.push(node.consequent)
      if (node.alternate != null) {
        children.push(node.consequent)
      }
      break
    case 'SwitchStatement':
      uses = uses.concat(parse(node.test).uses)
      node.cases.forEach((caseNode) => children.push(caseNode))
      break
    case 'SwitchCase':
      if (node.test != null) {
        uses = uses.concat(parse(node.test).uses)
      }
      node.consequent.forEach((con) => children.push(con))
      break
    case 'ThrowStatement':
      uses = uses.concat(parse(node.argument).uses)
      break
    case 'TryStatement':
      node.block.body.forEach(b => children.push(b))
      if (node.handler != null) {
        uses = uses.concat(parse(node.handler.param).uses)
        node.handler.body.body.forEach(b => children.push(b))
      } else {
        node.finalizer.body(b => children.push(b))
      }
      break
    case 'CatchClause':
      break
    case 'WhileStatement':
    case 'DoWhileStatement':
      uses = uses.concat(parse(node.test).uses)
      node.body.forEach(b => children.push(b))
      break
    case 'ForStatement':
      if (node.init != null) {
        declares = declares.concat(parse(node.init).id)
      }

      if (node.test != null) {
        uses = uses.concat(parse(node.test).uses)
      }

      if (node.update != null) {
        uses = uses.concat(parse(node.update).uses)
      }
      break
    case 'ForInStatement':
      declares = declares.concat(parse(node.left).id)
      uses = uses.concat(parse(node.right).uses)
      node.body.forEach(b => children.push(b))
      break
    case 'ForOfStatement':
      break
  }

  return new Node(id, type, loc, declares, uses, children)
}

/**
 *  interface ExpressionStatement <: Statement {
 *      type: "ExpressionStatement";
 *      expression: Expression;
 *  }
 */
class ExpressionStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const expression = parse(node.expression)

    this.declares = expression.declares
    this.uses = expression.uses
    this.returns = expression.returns
  }
}

/**
 *  interface BlockStatement <: Statement {
 *      type: "BlockStatement";
 *      body: [ Statement ];
 *      directives: [ Directive ];
 *  }
 */
class BlockStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const body = node.body.map(b => parse(b))

    body.forEach(b => {
      this.declares = b.declares
      this.uses = b.uses
      this.returns = b.returns
    })
  }
}

/**
 *  interface EmptyStatement <: Statement {
 *      type: "EmptyStatement";
 *  }
 */
class EmptyStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface DebuggerStatement <: Statement {
 *      type: "DebuggerStatement";
 *  }
 */
class DebuggerStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface WithStatement <: Statement {
 *      type: "WithStatement";
 *      object: Expression;
 *      body: Statement;
 *  }
 */
class WithStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const object = parse(node.object)
    const body = parse(node.body)

    this.uses = object.uses
    this.uses = object.returns
    this.uses = body.uses
    this.returns = body.returns
    this.declares = body.declares
  }
}

/**
 *  interface ReturnStatement <: Statement {
 *      type: "ReturnStatement";
 *      argument: Expression | null;
 *  }
 */
class ReturnStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    if (node.argument != null) {
      const argument = parse(node.argument)

      this.uses = argument.uses
      this.uses = argument.returns
      this.returns = argument.returns
    }
  }
}

/**
 *  interface LabeledStatement <: Statement {
 *      type: "LabeledStatement";
 *      label: Identifier;
 *      body: Statement;
 *  }
 */
class LabeledStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const label = parse(node.label)
    const body = parse(node.body)

    this.uses = label.returns
    this.declares = body.declares
    this.returns = body.returns
    this.uses = body.uses
  }
}

/**
 *  interface BreakStatement <: Statement {
 *      type: "BreakStatement";
 *      label: Identifier | null;
 *  }
 */
class BreakStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    if (node.label != null) {
      const label = parse(node.label)

      this.uses = label.uses
      this.returns = label.returns
    }
  }
}

/**
 *  interface ContinueStatement <: Statement {
 *      type: "ContinueStatement";
 *      label: Identifier | null;
 *  }
 */
class ContinueStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    if (node.label != null) {
      const label = parse(node.label)

      this.uses = label.uses
      this.returns = label.returns
    }
  }
}
class Choice extends AbstractNode {}
class IfStatement extends AbstractNode {}
class SwitchStatement extends AbstractNode {}
class SwitchCase extends AbstractNode {}
class Exceptions extends AbstractNode {}
class ThrowStatement extends AbstractNode {}
class TryStatement extends AbstractNode {}
class CatchClause extends AbstractNode {}
class Loops extends AbstractNode {}
class WhileStatement extends AbstractNode {}
class DoWhileStatement extends AbstractNode {}
class ForStatement extends AbstractNode {}
class ForInStatement extends AbstractNode {}
class ForOfStatement extends AbstractNode {}

module.exports = {
  ExpressionStatement,
  BlockStatement,
  EmptyStatement,
  DebuggerStatement,
  WithStatement,
  ReturnStatement,
  LabeledStatement,
  BreakStatement,
  ContinueStatement,
  Choice,
  IfStatement,
  SwitchStatement,
  SwitchCase,
  Exceptions,
  ThrowStatement,
  TryStatement,
  CatchClause,
  Loops,
  WhileStatement,
  DoWhileStatement,
  ForStatement,
  ForInStatement,
  ForOfStatement
}
