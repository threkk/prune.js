const AbstractNode = require('../abstract/node')
const parse = require('./parser')

/**
 *  interface Super <: Node {
 *      type: "Super";
 *  }
 */
class Super extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface Import <: Node {
 *      type: "Import";
 *  }
 */
class Import extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface ThisExpression <: Expression {
 *      type: "ThisExpression";
 *  }
 */
class ThisExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface ArrowFunctionExpression <: Function, Expression {
 *      type: "ArrowFunctionExpression";
 *      body: BlockStatement | Expression;
 *      expression: boolean;
 *  }
 *
 *  interface Function <: Node {
 *      id: Identifier | null;
 *      params: [ Pattern ];
 *      body: BlockStatement;
 *      generator: boolean;
 *      async: boolean;
 *  }
 */
class ArrowFunctionExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)

    if (node.id != null) {
      const id = parse(node.id)
      this.uses = id.uses
      this.returns = id.returns
    }

    const params = node.params.map((p) => parse(p))
    const body = parse(node.body)

    this.uses = body.uses
    this.declares = body.declares
    this.declares = params.map((p) => p.returns)
  }
}

/**
 *  interface YieldExpression <: Expression {
 *      type: "YieldExpression";
 *      argument: Expression | null;
 *      delegate: boolean;
 *  }
 */
class YieldExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    if (node.argument != null) {
      const argument = parse(node.argument)

      this.uses = argument.uses
    }
  }
}

/**
 *  interface AwaitExpression <: Expression {
 *      type: "AwaitExpression";
 *      argument: Expression | null;
 *  }
 */
class AwaitExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    if (node.argument != null) {
      const argument = parse(node.argument)

      this.uses = argument.uses
    }
  }
}

/**
 *  interface ArrayExpression <: Expression {
 *      type: "ArrayExpression";
 *      elements: [ Expression | SpreadElement | null ];
 *  }
 */
class ArrayExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const elements = node.elements.map(e => parse(e))

    elements.forEach(e => { this.uses = e.uses })
  }
}

/**
 *  interface ObjectExpression <: Expression {
 *      type: "ObjectExpression";
 *      properties: [ ObjectProperty | ObjectMethod | SpreadElement ];
 *  }
 */
class ObjectExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const properties = node.properties.map(p => parse(p))

    properties.forEach(p => { this.uses = p.uses })
  }
}

/**
 *  interface ObjectMember <: Node {
 *      key: Expression;
 *      computed: boolean;
 *      decorators: [ Decorator ];
 *  }
 */
class ObjectMember extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const key = parse(node.key)

    this.uses = key.uses
  }
}

/**
 *  interface ObjectProperty <: ObjectMember {
 *      type: "ObjectProperty";
 *      shorthand: boolean;
 *      value: Expression;
 *  }
 */
class ObjectProperty extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const value = parse(node.value)

    this.uses = value.uses
  }
}

/**
 *  interface ObjectMethod <: ObjectMember, Function {
 *      type: "ObjectMethod";
 *      kind: "get" | "set" | "method";
 *  }
 *  interface ObjectMember <: Node {
 *      key: Expression;
 *      computed: boolean;
 *      decorators: [ Decorator ];
 *  }
 *  interface Function <: Node {
 *      id: Identifier | null;
 *      params: [ Pattern ];
 *      body: BlockStatement;
 *      generator: boolean;
 *      async: boolean;
 *  }
 */
class ObjectMethod extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const key = parse(node.key)
    const body = parse(node.body)
    const params = node.params.map((p) => parse(p))
    this.children = body.children

    if (node.id != null) {
      const id = parse(node.id)
      this.returns = id.returns
      this.uses = id.uses
    }

    this.uses = key.uses
    this.uses = body.uses
    this.declares = body.declares
    this.declares = params.map((p) => p.returns)
  }
}

/**
 *  interface FunctionExpression <: Function, Expression {
 *      type: "FunctionExpression";
 *  }
 *
 *  interface Function <: Node {
 *      id: Identifier | null;
 *      params: [ Pattern ];
 *      body: BlockStatement;
 *      generator: boolean;
 *      async: boolean;
 *  }
 */
class FunctionExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const params = node.params.map(p => parse(p))
    const body = parse(node.body)
    this.children = body.children
    if (node.id != null) {
      const id = parse(node.id)
      this.returns = id.returns
      this.uses = id.uses
    }

    params.forEach(p => {
      if (p != null) {
        this.declares = p.returns
        this.uses = p.uses
      }
    })

    this.uses = body.uses
    this.declares = body.declares
  }
}

/**
 *  interface UnaryExpression <: Expression {
 *      type: "UnaryExpression";
 *      operator: UnaryOperator;
 *      prefix: boolean;
 *      argument: Expression;
 *  }
 */
class UnaryExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const argument = parse(node.argument)

    this.uses = argument.uses
  }
}

/**
 *  enum UnaryOperator {
 *      "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
 *  }
 */
class UnaryOperator extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface UpdateExpression <: Expression {
 *      type: "UpdateExpression";
 *      operator: UpdateOperator;
 *      argument: Expression;
 *      prefix: boolean;
 *  }
 */
class UpdateExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const argument = parse(node.argument)

    this.uses = argument.uses
  }
}

/**
 *  enum UpdateOperator {
 *      "++" | "--"
 *  }
 */
class UpdateOperator extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface BinaryExpression <: Expression {
 *      type: "BinaryExpression";
 *      operator: BinaryOperator;
 *      left: Expression;
 *      right: Expression;
 *  }
 */
class BinaryExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const left = parse(node.left)
    const right = parse(node.right)

    this.uses = left.uses
    this.uses = right.uses
  }
}

/**
 *  enum BinaryOperator {
 *      "==" | "!=" | "===" | "!=="
 *      | "<" | "<=" | ">" | ">="
 *      | "<<" | ">>" | ">>>"
 *      | "+" | "-" | "*" | "/" | "%"
 *      | "|" | "^" | "&" | "in"
 *      | "instanceof"
 *  }
 */
class BinaryOperator extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface AssignmentExpression <: Expression {
 *      type: "AssignmentExpression";
 *      operator: AssignmentOperator;
 *      left: Pattern | Expression;
 *      right: Expression;
 *  }
 */
class AssignmentExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const left = parse(node.left)
    const right = parse(node.right)

    this.returns = left.returns
    this.uses = left.uses
    this.uses = right.uses
    this.uses = right.returns
  }
}

/**
 *  enum AssignmentOperator {
 *      "=" | "+=" | "-=" | "*=" | "/=" | "%="
 *      | "<<=" | ">>=" | ">>>="
 *      | "|=" | "^=" | "&="
 *  }
 */
class AssignmentOperator extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface LogicalExpression <: Expression {
 *      type: "LogicalExpression";
 *      operator: LogicalOperator;
 *      left: Expression;
 *      right: Expression;
 *  }
 */
class LogicalExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const left = parse(node.left)
    const right = parse(node.right)

    this.uses = left.uses
    this.uses = right.uses
  }
}

/**
 *  enum LogicalOperator {
 *      "||" | "&&"
 *  }
 */
class LogicalOperator extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface SpreadElement <: Node {
 *      type: "SpreadElement";
 *      argument: Expression;
 *  }
 */
class SpreadElement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const argument = parse(node.argument)
    this.uses = argument.uses
  }
}

/**
 *  interface MemberExpression <: Expression, Pattern {
 *      type: "MemberExpression";
 *      object: Expression | Super;
 *      property: Expression;
 *      computed: boolean;
 *      optional: boolean | null;
 *  }
 */
class MemberExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const object = parse(node.object)
    const property = parse(node.property)

    this.uses = object.uses
    this.uses = property.uses

    this.uses = object.returns
    this.uses = property.returns
    // }
  }
}

/**
 *  interface BindExpression <: Expression {
 *      type: "BindExpression";
 *      object: Expression | null;
 *      callee: Expression;
 *  }
 */
class BindExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const callee = parse(node.callee)
    this.uses = callee.uses

    if (node.object != null) {
      const object = parse(node.object)
      this.uses = object.uses
    }
  }
}

/**
 *  interface ConditionalExpression <: Expression {
 *      type: "ConditionalExpression";
 *      test: Expression;
 *      alternate: Expression;
 *      consequent: Expression;
 *  }
 */
class ConditionalExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const test = parse(node.test)
    const alternate = parse(node.alternate)
    const consequent = parse(node.consequent)

    this.uses = test.uses
    this.uses = alternate.uses
    this.uses = consequent.uses
  }
}

/**
 *  interface CallExpression <: Expression {
 *      type: "CallExpression";
 *      callee: Expression | Super | Import;
 *      arguments: [ Expression | SpreadElement ];
 *      optional: boolean | null;
 *  }
 */
class CallExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const callee = parse(node.callee)
    const args = node.arguments.map(a => parse(a))

    this.uses = callee.uses
    // For classes and functions.
    this.uses = callee.returns
    args.forEach((a) => {
      this.uses = a.uses
      this.uses = a.returns
    })
  }
}

/**
 *  interface NewExpression <: CallExpression {
 *      type: "NewExpression";
 *      optional: boolean | null;
 *  }
 *  interface CallExpression <: Expression {
 *      type: "CallExpression";
 *      callee: Expression | Super | Import;
 *      arguments: [ Expression | SpreadElement ];
 *      optional: boolean | null;
 *  }
 */
class NewExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const callee = parse(node.callee)
    const args = node.arguments.map(a => parse(a))

    this.uses = callee.uses
    // For classes and functions.
    this.uses = callee.returns
    args.forEach((a) => {
      this.uses = a.uses
    })
  }
}

/**
 *  interface SequenceExpression <: Expression {
 *      type: "SequenceExpression";
 *      expressions: [ Expression ];
 *  }
 */
class SequenceExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const expressions = node.expressions.map((e) => parse(e))

    expressions.forEach(e => {
      this.uses = e.uses
    })
  }
}

/**
 *  interface DoExpression <: Expression {
 *      type: "DoExpression";
 *      body: BlockStatement
 *  }
 */
class DoExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const body = parse(node.body)

    this.uses = body.uses
    this.declares = body.declares
    this.returns = body.returns
  }
}

module.exports = {
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
}
