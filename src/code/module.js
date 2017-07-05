const AbstractNode = require('../abstract/node')
const parse = require('./parse')

/**
 *  interface ModuleDeclaration <: Node { }
 */
class ModuleDeclaration extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
  }
}

/**
 *  interface ModuleSpecifier <: Node {
 *      local: Identifier;
 *  }
 */
class ModuleSpecifier extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const local = parse(node.local)
    this.uses = local.returns
  }
}

/**
 *  interface ImportDeclaration <: ModuleDeclaration {
 *      type: "ImportDeclaration";
 *      specifiers: [ ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier ];
 *      source: Literal;
 *  }
 */
class ImportDeclaration extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const source = parse(node.source)
    const specifiers = node.specifiers.map(s => parse(s))

    this.uses = source.uses
    specifiers.forEach(s => {
      this.returns = s.returns
      this.uses = s.uses
    })
  }
}

/**
 *  interface ImportSpecifier <: ModuleSpecifier {
 *      type: "ImportSpecifier";
 *      imported: Identifier;
 *  }
 */
class ImportSpecifier extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const imported = parse(node.imported)
    const local = parse(node.local)

    this.uses = imported.uses
    this.uses = local.uses
    this.returns = local.returns
  }
}

/**
 *  interface ImportDefaultSpecifier <: ModuleSpecifier {
 *      type: "ImportDefaultSpecifier";
 *  }
 */
class ImportDefaultSpecifier extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const local = parse(node.local)

    this.uses = local.uses
    this.returns = local.returns
  }
}

/**
 *  interface ImportNamespaceSpecifier <: ModuleSpecifier {
 *      type: "ImportNamespaceSpecifier";
 *  }
 */
class ImportNamespaceSpecifier extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const local = parse(node.local)

    this.uses = local.uses
    this.returns = local.returns
  }
}

/**
 *  interface ExportNamedDeclaration <: ModuleDeclaration {
 *      type: "ExportNamedDeclaration";
 *      declaration: Declaration | null;
 *      specifiers: [ ExportSpecifier ];
 *      source: Literal | null;
 *  }
 */
class ExportNamedDeclaration extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const specifiers = node.specifiers.map(s => parse(s))
    specifiers.forEach(s => {
      this.returns = s.returns
      this.uses = s.uses
    })

    if (node.source != null) {
      const source = parse(node.source)
      this.uses = source.uses
    }

    if (node.declaration != null) {
      const declaration = parse(node.declaration)
      this.uses = declaration.uses
      this.returns = declaration.returns
    }
  }
}

/**
 *  interface ExportSpecifier <: ModuleSpecifier {
 *      type: "ExportSpecifier";
 *      exported: Identifier;
 *  }
 */
class ExportSpecifier extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const exported = parse(node.exported)
    const local = parse(node.local)

    this.uses = exported.uses
    this.uses = local.uses
    this.returns = local.returns
  }
}

/**
 * interface ExportDefaultDeclaration <: ModuleDeclaration {
 *      type: "ExportDefaultDeclaration";
 *      declaration: OptFunctionDeclaration | OptClassDeclaration | Expression;
 *  }
 */
class ExportDefaultDeclaration extends AbstractNode {
  constructor (node) {
    super(node.loc, node.type)
    const declaration = parse(node.declaration)

    this.uses = declaration.uses
    this.returns = declaration.returns
  }
}

/**
 *  interface OptFunctionDeclaration <: FunctionDeclaration {
 *      id: Identifier | null;
 *  }
 *
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
class OptFunctionDeclaration extends AbstractNode {}

/**
 *  interface OptClasDeclaration <: ClassDeclaration {
 *      id: Identifier | null;
 *  }
 *
 *  interface ClassDeclaration <: Class, Declaration {
 *      type: "ClassDeclaration";
 *      id: Identifier;
 *  }
 *
 *  interface Class <: Node {
 *      id: Identifier | null;
 *      superClass: Expression | null;
 *      body: ClassBody;
 *      decorators: [ Decorator ];
 *  }
 */
class OptClasDeclaration extends AbstractNode {}

/**
 *  interface ExportAllDeclaration <: ModuleDeclaration {
 *      type: "ExportAllDeclaration";
 *      source: Literal;
 *  }
 */
class ExportAllDeclaration extends AbstractNode {}

module.exports = {
  ModuleDeclaration,
  ModuleSpecifier,
  ImportDeclaration,
  ImportSpecifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ExportNamedDeclaration,
  ExportSpecifier,
  ExportDefaultDeclaration,
  OptFunctionDeclaration,
  OptClasDeclaration,
  ExportAllDeclaration
}
