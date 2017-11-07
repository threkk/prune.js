const AbstractNode = require('../abstract/node')

/**
 *  interface JSXIdentifier <: Identifier {
 *     type: "JSXIdentifier";
 *  }
 */
class JSXIdentifier extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    this.returns = node.name
  }
}

/**
 * interface JSXMemberExpression <: Expression {
 *  type: "JSXMemberExpression";
 *  object: JSXMemberExpression | JSXIdentifier;
 *  property: JSXIdentifier;
 * }
 */
class JSXMemberExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXNamespacedName <: Expression {
 *      type: "JSXNamespacedName";
 *      namespace: JSXIdentifier;
 *      name: JSXIdentifier;
 *  }
 */
class JSXNamespacedName extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXEmptyExpression <: Node {
 *      type: "JSXEmptyExpression";
 *  }
 */
class JSXEmptyExpression extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXExpressionContainer <: Node {
 *      type: "JSXExpressionContainer";
 *      expression: Expression | JSXEmptyExpression;
 *  }
 */
class JSXExpressionContainer extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXSpreadChild <: Node {
 *      type: "JSXSpreadChild";
 *      expression: Expression;
 *  }
 */
class JSXSpreadChild extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXBoundaryElement <: Node {
 *      name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName;
 *  }
 */
class JSXBoundaryElement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXOpeningElement <: JSXBoundaryElement {
 *      type: "JSXOpeningElement";
 *      attributes: [ JSXAttribute | JSXSpreadAttribute ];
 *      selfClosing: boolean;
 *  }
 */
class JSXOpeningElement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXClosingElement <: JSXBoundaryElement {
 *      type: "JSXClosingElement";
 *  }
 */
class JSXClosingElement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXAttribute <: Node {
 *      type: "JSXAttribute";
 *      name: JSXIdentifier | JSXNamespacedName;
 *      value: Literal | JSXExpressionContainer | JSXElement | JSXFragment | null;
 *  }
 */
class JSXAttribute extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXSpreadAttribute <: SpreadElement {
 *      type: "JSXSpreadAttribute";
 *  }
 */
class JSXSpreadAttribute extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXText <: Node {
 *      type: "JSXText";
 *      value: string;
 *      raw: string;
 *  }
 *
 * JSX Text node stores a string literal found in JSX element children.
 */
class JSXText extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXElement <: Expression {
 *      type: "JSXElement";
 *      openingElement: JSXOpeningElement;
 *      children: [ JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment ];
 *      closingElement: JSXClosingElement | null;
 *  }
 *
 * JSX element consists of opening element, list of children and optional closing element:
 */
class JSXElement extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXFragment <: Expression {
 *      type: "JSXFragment";
 *      openingFragment: JSXOpeningFragment;
 *      children: [ JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment ];
 *      closingFragment: JSXClosingFragment;
 * }
 *
 * JSX fragment consists of an opening fragment, list of children, and closing fragment:
 */
class JSXFragment extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXOpeningFragment <: Node {
 *      type: "JSXOpeningFragment";
 *  }
 */
class JSXOpeningFragment extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

/**
 *  interface JSXClosingFragment <: Node {
 *      type: "JSXClosingFragment";
 *  }
 */
class JSXClosingFragment extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    // TODO
  }
}

module.exports = {
  JSXIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  JSXEmptyExpression,
  JSXExpressionContainer,
  JSXSpreadChild,
  JSXBoundaryElement,
  JSXOpeningElement,
  JSXClosingElement,
  JSXAttribute,
  JSXSpreadAttribute,
  JSXText,
  JSXElement,
  JSXFragment,
  JSXOpeningFragment,
  JSXClosingFragment
}
