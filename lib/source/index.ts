import { PathLike } from 'fs'
import { loadFile, createASTParser } from './ast'
import { extractAllStatements } from './visitor/statements'
import { FunctionScope, Scope, GlobalScope, BlockScope } from './scope'
import { extractBlockStatements } from './visitor/blocks'
import {
  Graph,
  StatementNode,
  Relation,
  Relationship,
  hash
} from './call-graph'
import {
  registerHoisted,
  registerDeclarations,
  findIdentifiers
} from './register/declaration'

export async function buildGraph(path: PathLike): Promise<Graph> {
  const parse = createASTParser(false)
  const graph = new Graph()
  const file = await loadFile(path)
  const ast = parse(file)
  const globalScope = new GlobalScope()

  buildFuncGraph({ graph, ast, parent: globalScope, isFuncScope: true })

  console.log(graph, scope)
  return graph
}

interface BuildGraphProps {
  graph: Graph
  parent: Scope
  isFuncScope: boolean
  ast: acorn.Node
}

function buildFuncGraph(props: BuildGraphProps): void {
  const scope = new FunctionScope(props.parent)
  registerHoisted({ st: props.ast, scope, graph: props.graph })
  buildChildrenScope({ scope, ...props })
  linkNodes({ scope, ...props })
}

interface BuildFuncGraphProps extends BuildGraphProps {
  scope: Scope
}

function linkNodes(props: BuildFuncGraphProps): void {
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

function buildChildrenScope(props: BuildFuncGraphProps) {
  const statements = extractBlockStatements(props.ast)

  for (const st of statements) {
    // Add edges: find declarations or function calls.
    // If it has a block descendant
    // recursive call.
    registerDeclarations({ st, scope: props.scope, graph: props.graph })

    // Recursive call.
    switch (st.type) {
      case 'IfStatement':
        buildChildrenScope({
          graph: props.graph,
          isFuncScope: false,
          parent: props.scope,
          ast: (st as any).consequent,
          scope: new BlockScope(props.scope)
        })

        if ((st as any).alternate != null) {
          buildChildrenScope({
            graph: props.graph,
            isFuncScope: false,
            parent: props.scope,
            ast: (st as any).alternate,
            scope: new BlockScope(props.scope)
          })
        }
        break
      case 'SwitchStatement':
        buildChildrenScope({
          graph: props.graph,
          isFuncScope: false,
          parent: props.scope,
          ast: (st as any).cases,
          scope: new BlockScope(props.scope)
        })
        break
      case 'TryStatement':
        const { block, handler, finalizer } = st as any
        buildChildrenScope({
          graph: props.graph,
          isFuncScope: false,
          parent: props.scope,
          ast: block,
          scope: new BlockScope(props.scope)
        })

        if (handler != null) {
          const newScope = new BlockScope(handler)
          const ids = findIdentifiers(handler.param)

          ids.forEach(id => {
            newScope.add({
              key: id,
              value: {
                id,
                hash: hash(st),
                isImport: false,
                isCallable: false,
                properties: {
                  name: {
                    properties: {},
                    isCallable: false,
                    declarationSt: st,
                    isImport: false,
                    hash: hash(st),
                    id: 'name'
                  },
                  message: {
                    properties: {},
                    isCallable: false,
                    declarationSt: st,
                    isImport: false,
                    hash: hash(st),
                    id: 'name'
                  }
                },
                declarationSt: st
              }
            })
          })

          buildChildrenScope({
            graph: props.graph,
            isFuncScope: false,
            parent: props.scope,
            ast: handler,
            scope: newScope
          })
        }

        if (finalizer != null) {
          buildChildrenScope({
            graph: props.graph,
            isFuncScope: false,
            parent: props.scope,
            ast: finalizer,
            scope: new BlockScope(props.scope)
          })
        }
        break
      case 'WhileStatement':
        buildChildrenScope({
          graph: props.graph,
          isFuncScope: false,
          parent: props.scope,
          ast: (st as any).body,
          scope: new BlockScope(props.scope)
        })
        break
      case 'DoWhileStatement':
        buildChildrenScope({
          graph: props.graph,
          isFuncScope: false,
          parent: props.scope,
          ast: (st as any).body,
          scope: new BlockScope(props.scope)
        })
        break
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
        buildChildrenScope({
          graph: props.graph,
          isFuncScope: false,
          parent: props.scope,
          ast: (st as any).body,
          scope: new BlockScope(props.scope)
        })
        break
    }
  }
}

// buildGraph('./examples/sample-webserver/simple-webserver.js')
buildGraph('./examples/variable-declarations/index.js')
