import { PathLike } from 'fs'
import { loadFile, createASTParser } from './ast'
import { extractAllStatements, onCallStatement } from './visitor/statements'
import {
  FunctionScope,
  Scope,
  GlobalScope,
  BlockScope,
  ScopeVariable
} from './scope'
import { extractBlockStatements } from './visitor/blocks'
import { Graph, StatementNode } from './graph'
import { getDeclarationSetters } from './register/declaration'
import { registerHoisted } from './register/hoisted'
import { getArgumentsSettersFromDecl } from './register/arguments'
import { findIdentifiers, getPropertyChain } from './visitor/expression'
import { linkVarWrite } from './linker/read-write'
import { LinkProps } from './linker/interfaces'
import { linkPropsWrite } from './linker/read-write-properties'

export function buildGraph(path: PathLike): Graph {
  const parse = createASTParser(false)
  const graph = new Graph()
  const file = loadFile(path)
  const ast = parse(file)
  const globalScope = new GlobalScope()

  buildFuncGraph({
    graph,
    ast,
    scope: globalScope,
    isFuncScope: true
  })

  return graph
}

interface BuildGraphProps {
  graph: Graph
  scope: Scope
  isFuncScope: boolean
  ast: acorn.Node
}

function buildFuncGraph(props: BuildGraphProps): void {
  registerHoisted({ st: props.ast, scope: props.scope, graph: props.graph })
  buildChildrenScope(props)
  linkNodes(props)
}

function linkNodes(props: BuildGraphProps): void {
  const statements = extractAllStatements(props.ast)

  statements.forEach(st => {
    const currentNode = new StatementNode({
      scope: props.scope,
      node: st,
      isTerminal: false,
      isDeclaration: false
    })
    props.graph.addNode(currentNode)
    const args: LinkProps = {
      statement: st,
      graph: props.graph,
      scope: props.scope
    }
    linkVarWrite(args)
    linkPropsWrite(args)
  })
}

function buildChildrenScope(props: BuildGraphProps) {
  const statements = extractBlockStatements(props.ast)

  for (const st of statements) {
    // Add edges: find declarations or function calls.
    // If it has a block descendant
    // recursive call.
    getDeclarationSetters(st, props.scope).forEach(setter =>
      props.scope.add(setter)
    )

    const baseVariable = {
      graph: props.graph,
      isFuncScope: false,
      scope: new BlockScope(props.scope),
      parent: props.scope
    }

    // Recursive call.
    switch (st.type) {
      case 'IfStatement':
        buildChildrenScope({ ...baseVariable, ast: (st as any).consequent })

        if ((st as any).alternate != null) {
          buildChildrenScope({ ...baseVariable, ast: (st as any).alternate })
        }
        break
      case 'SwitchStatement':
        buildChildrenScope({ ...baseVariable, ast: (st as any).cases })
        break
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
        buildChildrenScope({ ...baseVariable, ast: (st as any).body })
        break
      case 'TryStatement':
        const { block, handler, finalizer } = st as any
        buildChildrenScope({ ...baseVariable, ast: block })

        if (handler != null) {
          const ids = findIdentifiers(handler.param)
          const newScope = new BlockScope(props.scope)
          ids.forEach(id => {
            newScope.add({
              key: id,
              value: {
                id,
                hasProperties: true,
                isImport: false,
                isExport: false,
                isCallable: false,
                properties: {
                  name: {
                    properties: {},
                    hasProperties: false,
                    isCallable: false,
                    declarationSt: st,
                    isImport: false,
                    isExport: false,
                    id: 'name'
                  },
                  message: {
                    properties: {},
                    hasProperties: false,
                    isCallable: false,
                    declarationSt: st,
                    isImport: false,
                    isExport: false,
                    id: 'name'
                  }
                },
                declarationSt: st
              }
            })
          })

          buildChildrenScope({ ...baseVariable, scope: newScope, ast: handler })
        }

        if (finalizer != null) {
          buildChildrenScope({ ...baseVariable, ast: finalizer })
        }
        break
    }

    onCallStatement(st, (node: any) => {
      // TODO:
      // - Classes: super()
      // - Classes: extends ParentClass
      // - Callee : FunctionDeclaration and co.
      // - Callee : ClassDeclaration
      // - Arguments: parameters
      // - Arguments: spread elements
      const scopeProps = {
        ast: null,
        graph: props.graph,
        scope: new FunctionScope(props.scope),
        isFuncScope: true
      }

      let func: ScopeVariable = null
      switch (node.callee.type) {
        case 'Identifier':
          const identifier = node.callee.name
          func = props.scope.get(identifier)
          if (!func || !func.isCallable || !func.callable) {
            console.log(func)
            console.log(`${identifier} not found.`)
            return
          }

          if (func.callable.type !== 'Class') {
            scopeProps.ast = (func.callable as any).body
            if (func.callable.type === 'ArrowFunctionExpression') {
              scopeProps.scope = props.scope as FunctionScope
            }
          }
          break
        case 'MemberExpression':
          const properties = getPropertyChain(node.callee.left)
          func = props.scope.get(properties)

          if (!func || !func.isCallable || !func.callable) {
            console.log(`${node.calee.left} not found.`)
            return
          }

          scopeProps.ast = (func.callable as any).body
          if (func.callable.type === 'ArrowFunctionExpression') {
            scopeProps.scope = props.scope as FunctionScope
          }
          break
        case 'ArrowFunctionExpression':
          scopeProps.scope = props.scope as FunctionScope
        // no break
        case 'FunctionExpression':
          scopeProps.ast = node.callee.body
          buildFuncGraph(scopeProps)
          break
        default:
        // Noop
      }

      getArgumentsSettersFromDecl(func).forEach(setter =>
        scopeProps.scope.add(setter)
      )

      buildFuncGraph(scopeProps)
    })
  }
}
