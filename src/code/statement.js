const AbstractNode = require('../abstract/node')
const parse = require('./parser')

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

    this._isExporter =
      node.expression.type === 'AssignmentExpression' &&
      node.expression.left.type === 'MemberExpression' &&
      node.expression.left.object.type === 'Identifier' &&
      node.expression.left.object.name === 'module' &&
      node.expression.left.property.type === 'Identifier' &&
      node.expression.left.property.name === 'exports'
    if (this._isExporter) {
      console.log(node.expression.right)
    }
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
    this.children = node.body

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
    this.children = body.children

    this.uses = object.uses
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
      // If we return a new instance, we "use" it.
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
    this.children = body.children

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

/**
 *  interface IfStatement <: Statement {
 *      type: "IfStatement";
 *      test: Expression;
 *      consequent: Statement;
 *      alternate: Statement | null;
 *  }
 */
class IfStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const test = parse(node.test)
    const consequent = parse(node.consequent)

    this.uses = test.uses
    this.uses = consequent.uses
    this.declares = consequent.declares
    this.returns = consequent.returns

    if (node.alternate != null) {
      const alternate = parse(node.alternate)

      this.declares = alternate.declares
      this.uses = alternate.uses
      this.returns = alternate.returns
    }
  }
}

/**
 *  interface SwitchStatement <: Statement {
 *      type: "SwitchStatement";
 *      discriminant: Expression;
 *      cases: [ SwitchCase ];
 *  }
 */
class SwitchStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const discriminant = parse(node.discriminant)
    const cases = node.cases.map(c => parse(c))

    this.uses = discriminant.uses
    cases.forEach((c) => {
      // TODO: Review this, does not look too alright.
      this.uses = c.uses
      this.uses = c.returns
      this.returns = c.returns
    })
  }
}

/**
 *  interface SwitchCase <: Node {
 *      type: "SwitchCase";
 *      test: Expression | null;
 *      consequent: [ Statement ];
 *  }
 */
class SwitchCase extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    if (node.test != null) {
      const test = parse(node.test)
      this.uses = test.uses
    }

    const consequent = node.consequent.map(c => parse(c))
    consequent.forEach(c => {
      this.uses = c.uses
      this.uses = c.returns
      this.returns = c.returns
    })
  }
}

/**
 *  interface ThrowStatement <: Statement {
 *      type: "ThrowStatement";
 *      argument: Expression;
 *  }
 */
class ThrowStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const argument = parse(node.argument)

    this.uses = argument.uses
  }
}

/**
 *  interface TryStatement <: Statement {
 *      type: "TryStatement";
 *      block: BlockStatement;
 *      handler: CatchClause | null;
 *      finalizer: BlockStatement | null;
 *  }
 */
class TryStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const block = parse(node.block)

    this.declares = block.declares
    this.returns = block.returns
    this.uses = block.uses
    this.children = block.children

    if (node.handler != null) {
      const handler = parse(node.handler)
      this.uses = handler.uses
      this.declares = handler.declares
      this.returns = handler.returns
    }

    if (node.finalizer != null) {
      const finalizer = parse(node.finalizer)
      this.uses = finalizer.uses
      this.declares = finalizer.declares
      this.returns = finalizer.returns
      this.children = finalizer.children
    }
  }
}

/**
 *  interface CatchClause <: Node {
 *      type: "CatchClause";
 *      param: Pattern;
 *      body: BlockStatement;
 *  }
 */
class CatchClause extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const param = parse(node.param)
    const body = parse(node.body)

    this.declares = param.returns
    this.uses = param.uses
    this.declares = body.declares
    this.uses = body.uses
    this.returns = body.returns
    this.children = body.children
  }
}

/**
 *  interface WhileStatement <: Statement {
 *      type: "WhileStatement";
 *      test: Expression;
 *      body: Statement;
 *  }
 */
class WhileStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const test = parse(node.test)
    const body = parse(node.body)

    this.uses = test.uses
    this.declares = body.declares
    this.uses = body.uses
    this.returns = body.returns
  }
}

/**
 *  interface DoWhileStatement <: Statement {
 *      type: "DoWhileStatement";
 *      body: Statement;
 *      test: Expression;
 *  }
 */
class DoWhileStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const test = parse(node.test)
    const body = parse(node.body)

    this.uses = test.uses
    this.declares = body.declares
    this.uses = body.uses
    this.returns = body.returns
  }
}

/**
 *  interface ForStatement <: Statement {
 *      type: "ForStatement";
 *      init: VariableDeclaration | Expression | null;
 *      test: Expression | null;
 *      update: Expression | null;
 *      body: Statement;
 *  }
 */
class ForStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const body = parse(node.body)
    this.declares = body.declares
    this.uses = body.uses
    this.returns = body.returns

    if (node.init != null) {
      const init = parse(node.init)
      this.declares = init.returns
    }

    if (node.test != null) {
      const test = parse(node.test)
      this.uses = test.uses
    }

    if (node.update != null) {
      const update = parse(node.update)
      this.uses = update.uses
    }
  }
}

/**
 *  interface ForInStatement <: Statement {
 *      type: "ForInStatement";
 *      left: VariableDeclaration |  Expression;
 *      right: Expression;
 *      body: Statement;
 *  }
 */
class ForInStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const left = parse(node.left)
    const right = parse(node.right)
    const body = parse(node.body)

    this.declares = left.returns
    this.uses = left.uses
    this.uses = right.uses

    this.declares = body.declares
    this.uses = body.uses
    this.returns = body.returns
  }
}

/**
 *  interface ForOfStatement <: ForInStatement {
 *      type: "ForOfStatement";
 *      await: boolean;
 *  }
 */
class ForOfStatement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const left = parse(node.left)
    const right = parse(node.right)
    const body = parse(node.body)

    this.declares = left.returns
    this.uses = left.uses
    this.uses = right.uses

    this.declares = body.declares
    this.uses = body.uses
    this.returns = body.returns
  }
}

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
}
