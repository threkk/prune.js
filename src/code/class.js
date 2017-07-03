const AbstractNode = require('../abstract/node')
const parse = require('./parse')

/**
 *  interface Class <: Node {
 *      id: Identifier | null;
 *      superClass: Expression | null;
 *      body: ClassBody;
 *      decorators: [ Decorator ];
 *  }
 */
class Class extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const body = parse(node.body)

    if (node.id != null) {
      const id = parse(node.id)
      this.returns = id.returns
    }

    if (node.superClass != null) {
      const superClass = parse(node.superClass)
      this.uses = superClass.returns
    }

    this.declares = body.declares
    this.uses = body.uses
  }
}

/**
 *  interface ClassBody <: Node {
 *      type: "ClassBody";
 *      body: [ ClassMethod | ClassProperty | ClassPrivateProperty ];
 *  }
 */
class ClassBody extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)

    node.body.forEach((b) => {
      const body = parse(b)
      this.declares = body.declares
      this.uses = body.uses
    })
  }
}

/**
 *  interface ClassMethod <: Function {
 *      type: "ClassMethod";
 *      key: Expression;
 *      kind: "constructor" | "method" | "get" | "set";
 *      computed: boolean;
 *      static: boolean;
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
class ClassMethod extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const key = parse(node.key)
    const params = node.params.map((p) => parse(p))
    const body = parse(node.body)

    this.returns = key.returns
    this.uses = body.uses
    this.declares = body.declares
    this.declares = params.map((p) => p.returns)
  }
}

/**
 *  interface ClassProperty <: Node {
 *      type: "ClassProperty";
 *      key: Expression;
 *      value: Expression;
 *      computed: boolean;
 *  }
 */
class ClassProperty extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const key = parse(node.key)
    const value = parse(node.value)

    this.returns = key.returns
    this.uses = key.uses
    this.uses = value.uses
  }
}

/**
 *  interface ClassPrivateProperty <: Node {
 *      type: "ClassPrivateProperty";
 *      key: Identifier;
 *      value: Expression;
 *  }
 */
class ClassPrivateProperty extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const key = parse(node.key)
    const value = parse(node.value)

    this.declares = key.returns
    this.uses = value.uses
    this.uses = value.returns
  }
}

/**
 *  interface ClassDeclaration <: Class, Declaration {
 *      type: "ClassDeclaration";
 *      id: Identifier;
 *  }
 */
class ClassDeclaration extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const id = parse(node.id)

    this.returns = id.returns
  }
}

/**
 *  interface ClassExpression <: Class, Expression {
 *      type: "ClassExpression";
 *  }
 */
class ClassExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface MetaProperty <: Expression {
 *      type: "MetaProperty";
 *      meta: Identifier;
 *      property: Identifier;
 *  }
 */
class MetaProperty extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // WTF is a meta property???
    console.log(node)
  }
}

module.exports = {
  Class,
  ClassBody,
  ClassMethod,
  ClassProperty,
  ClassPrivateProperty,
  ClassDeclaration,
  ClassExpression,
  MetaProperty
}