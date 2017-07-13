const AbstractNode = require('../abstract/node')
const parse = require('./parser')

/**
 *  interface Identifier <: Expression, Pattern {
 *      type: "Identifier";
 *      name: string;
 *  }
 */
class Identifier extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    this.returns = node.name
  }
}

/**
 *  interface PrivateName <: Expression, Pattern {
 *      type: "PrivateName";
 *      name: Identifier;
 *  }
 */
class PrivateName extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const name = parse(node.name)
    this.returns = name.returns
  }
}

/**
 * interface Literal <: Expression { }
 */
class Literal extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface RegExpLiteral <: Literal {
 *      type: "RegExpLiteral";
 *      pattern: string;
 *      flags: string;
 * }
 */
class RegExpLiteral extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface NullLiteral <: Literal {
 *      type: "NullLiteral";
 *  }
 */
class NullLiteral extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface StringLiteral <: Literal {
 *      type: "StringLiteral";
 *      value: string;
 *  }
 */
class StringLiteral extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface BooleanLiteral <: Literal {
 *      type: "BooleanLiteral";
 *      value: boolean;
 *  }
 */
class BooleanLiteral extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface NumericLiteral <: Literal {
 *      type: "NumericLiteral";
 *      value: number;
 *  }
 */
class NumericLiteral extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface TemplateLiteral <: Expression {
 *      type: "TemplateLiteral";
 *      quasis: [ TemplateElement ];
 *      expressions: [ Expression ];
 *  }
 */
class TemplateLiteral extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const quasis = node.quasis.map((q) => parse(q))
    const expressions = node.expressions.map((e) => parse(e))

    expressions.forEach((exp) => {
      this.uses = exp.uses
    })

    quasis.forEach((quasi) => {
      this.uses = quasi.uses
    })
  }
}

/**
 *  interface TaggedTemplateExpression <: Expression {
 *      type: "TaggedTemplateExpression";
 *      tag: Expression;
 *      quasi: TemplateLiteral;
 *  }
 */
class TaggedTemplateExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.constructor)
    const tag = parse(node.tag)
    const quasi = parse(node.quasi)

    this.uses = tag.uses
    this.uses = quasi.uses
  }
}

/**
 *  interface TemplateElement <: Node {
 *      type: "TemplateElement";
 *      tail: boolean;
 *      value: {
 *          cooked: string | null;
 *          raw: string;
 *      };
 *  }
 */
class TemplateElement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

module.exports = {
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
}
