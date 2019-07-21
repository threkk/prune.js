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
import { Graph, StatementNode, Relation, Relationship } from './call-graph'
import { getDeclarationSetters } from './register/declaration'
import { registerHoisted } from './register/hoisted'
import { getArgumentsSettersFromDecl } from './register/arguments'
import { findIdentifiers, getPropertyChain } from './visitor/expression'

export async function buildGraph(path: PathLike): Promise<Graph> {
  const parse = createASTParser(false)
  const graph = new Graph()
  const file = await loadFile(path)
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

  let prevNode: StatementNode
  for (const st of statements) {
    const currentNode = new StatementNode(st, props.scope)
    props.graph.addNode(currentNode)
    if (prevNode) {
      props.graph.addEdge(
        new Relation(prevNode, currentNode, Relationship.NEXT)
      )

      props.graph.addEdge(
        new Relation(currentNode, prevNode, Relationship.PREVIOUS)
      )
    }
    prevNode = currentNode
  }
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

    onCallStatement(st, node => {
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

      let func = null
      switch (node.callee.type) {
        case 'Identifier':
          const identifier = node.callee.name
          func = props.scope.get(identifier)
          if (!func || !func.isCallable || !func.callable) {
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
          const [obj, ...properties] = getPropertyChain(node.callee.left)

          const baseVar: ScopeVariable = props.scope.get(obj)
          if (!baseVar) return
          func = properties.reduce(
            (prev: ScopeVariable, curr: string) =>
              prev === null ? null : prev.properties[curr] || null,
            baseVar
          )

          if (!func || !func.isCallable || !func.callable) {
            console.log(`${[obj, ...properties]} not found.`)
            return
          }

          scopeProps.ast = (func.callable as any).body
          if (func.callable.type === 'ArrowFunctionExpression') {
            scopeProps.scope = props.scope as FunctionScope
          }
          break
        case 'ArrowFunctionExpression':
          func = node
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

buildGraph('./examples/calls/index.js')
// buildGraph('./examples/parameters/index.js')
// buildGraph('./examples/classes/index.js')
// buildGraph('./examples/exports/index.js')
// buildGraph('./examples/global-variables/index.js')
// buildGraph('./examples/function-chaining/index.js')
// buildGraph('./examples/function-types/index.js')
// buildGraph('./examples/sample-webserver/simple-webserver.js')
// buildGraph('./examples/variable-declarations/index.js')
