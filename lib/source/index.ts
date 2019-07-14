import { PathLike } from 'fs'
import { loadFile, createASTParser } from './ast'
import { extractAllStatements } from './visitor/statements'
import { FunctionScope, Scope, GlobalScope, BlockScope } from './scope'
import { extractBlockStatements } from './visitor/blocks'
import { Graph, StatementNode, Relation, Relationship } from './call-graph'
import {
  registerHoisted,
  registerDeclarations,
  findIdentifiers,
  onCallStatement
} from './register/declaration'

export async function buildGraph(path: PathLike): Promise<Graph> {
  const parse = createASTParser(false)
  const graph = new Graph()
  const file = await loadFile(path)
  const ast = parse(file)
  const globalScope = new GlobalScope()
  const scope = new FunctionScope(globalScope)

  globalScope.bootstrap()
  buildFuncGraph({
    graph,
    ast,
    parent: globalScope,
    scope: globalScope,
    isFuncScope: true
  })

  return graph
}

interface BuildGraphProps {
  graph: Graph
  parent: Scope
  scope: Scope
  isFuncScope: boolean
  ast: acorn.Node
}

function buildFuncGraph(props: BuildGraphProps): void {
  registerHoisted({ st: props.ast, scope: props.scope, graph: props.graph })
  buildChildrenScope(props)
  linkNodes(props)
  console.log(props.scope)
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
    registerDeclarations({ st, scope: props.scope, graph: props.graph })

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
                isImport: false,
                isExport: false,
                isCallable: false,
                properties: {
                  name: {
                    properties: {},
                    isCallable: false,
                    declarationSt: st,
                    isImport: false,
                    isExport: false,
                    id: 'name'
                  },
                  message: {
                    properties: {},
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
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
        buildChildrenScope({ ...baseVariable, ast: (st as any).body })
        break
    }

    onCallStatement(st, node => {
      let ast
      if (node.callee.type === 'Identifier') {
        const identifier = node.callee.name

        const func = props.scope.get(identifier)

        if (!func || !func.isCallable || !func.callable) {
          console.log(`${identifier} not found.`)
          return
        }

        buildFuncGraph({
          ast: (func.callable as any).body,
          graph: props.graph,
          scope: new FunctionScope(props.scope),
          parent: props.scope,
          isFuncScope: true
        })
      }
    })
  }
}

buildGraph('./examples/global-variables/index.js')
// buildGraph('./examples/function-chaining/index.js')
// buildGraph('./examples/sample-webserver/simple-webserver.js')
// buildGraph('./examples/variable-declarations/index.js')
