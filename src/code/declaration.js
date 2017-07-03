const AbstractNode = require('../abstract/node')
const parse = require('./parse')

function parseVariable (node) {
  const id = []
  const type = {
    main: 'variable',
    sub: node.type
  }

  const loc = node.loc
  const declares = []
  const uses = []
  const children = []

  switch (node.type) {
    case 'Pattern':
      break
    case 'AssignmentProperty':
      uses.push(parse(node).id)
      break
    case 'ObjectPattern':
      node.properties.forEach((prop) => uses.push(parse(prop).id))
      break
    case 'ArrayPattern':
    case 'RestElement':
    case 'AssignmentPattern':
    case 'VariableDeclaration':
      node.declarations.forEach((decl) => id.push(parse(decl).id))
      break
    case 'VariableDeclarator':
      id.push(node.id.name)
      if (node.init != null) {
        parse(node.init).id.forEach((id) => uses.push(id))
      }
      break
  }

  return new Node(id, type, loc, declares, uses, children)
}

/**
 *  interface FunctionDeclaration <: Function, Declaration {
 *      type: "FunctionDeclaration";
 *      id: Identifier;
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
class FunctionDeclaration extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const params = node.params.map(p => parse(p))
    const body = node.body

    params.forEach(p => {
      this.declares = p.returns
    })

    this.uses = body.uses
    this.declares = body.declares

    if (node.id != null) {
      const id = parse(node.id)
      this.returns = id.returns
    }
  }
}

/**
 *  interface VariableDeclaration <: Declaration {
 *      type: "VariableDeclaration";
 *      declarations: [ VariableDeclarator ];
 *      kind: "var" | "let" | "const";
 *  }
 */
class VariableDeclaration extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const declarations = node.declarations.map(d => parse(d))

    this.uses = declarations.uses
    this.returns = declarations.returns
  }
}

/**
 *  interface VariableDeclarator <: Node {
 *      type: "VariableDeclarator";
 *      id: Pattern;
 *      init: Expression | null;
 *  }
 */
class VariableDeclarator extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const id = parse(node.id)
    const init = parse(node.init)

    this.returns = id.returns
    this.uses = init.uses
  }
}

/**
 *  interface AssignmentProperty <: ObjectProperty {
 *      value: Pattern;
 *  }
 */
class AssignmentProperty extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const value = parse(node.value)

    this.uses = value.uses
    this.returns = value.returns
  }
}

/**
 *  interface ObjectPattern <: Pattern {
 *      type: "ObjectPattern";
 *      properties: [ AssignmentProperty | RestElement ];
 *  }
 */
class ObjectPattern extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const properties = node.properties.map(p => parse(p))

    properties.forEach(p => {
      this.uses = p.uses
      this.returns = p.returns
    })
  }
}

/**
 *  interface ArrayPattern <: Pattern {
 *      type: "ArrayPattern";
 *      elements: [ Pattern | null ];
 *  }
 */
class ArrayPattern extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const elements = node.elements.map(e => parse(e))

    elements.forEach(e => {
      this.uses = e.uses
      this.returns = e.returns
    })
  }
}

/**
 *  interface RestElement <: Pattern {
 *      type: "RestElement";
 *      argument: Pattern;
 *  }
 */
class RestElement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const argument = parse(node.argument)

    this.uses = argument.uses
    this.returns = argument.returns
  }
}

/**
 *  interface AssignmentPattern <: Pattern {
 *      type: "AssignmentPattern";
 *      left: Pattern;
 *      right: Expression;
 *  }
 */
class AssignmentPattern extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const left = parse(node.left)
    const right = parse(node.right)

    this.uses = right.uses
    this.uses = left.uses
    this.returns = left.returns
  }
}

module.exports = {
  FunctionDeclaration,
  VariableDeclaration,
  VariableDeclarator,
  AssignmentProperty,
  ObjectPattern,
  ArrayPattern,
  RestElement,
  AssignmentPattern
}