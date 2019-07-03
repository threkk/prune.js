import { PathLike } from 'fs'
import { loadFile, createASTParser } from './ast'
import { extractAllStatements } from './visitor/statements'
import { StatementNode, Relation, Relationship } from './call-graph'
import { Graph } from '../util/graph'
import { FunctionScope, Scope, GlobalScope, BlockScope } from './scope'
import { extractBlockStatements } from './visitor/blocks'
import { registerHoisted } from './register/declaration'

export async function buildGraph(path: PathLike): Promise<Graph> {
  const parse = createASTParser(false)
  const graph = new Graph()
  const file = await loadFile(path)
  const ast = parse(file)
  const globalScope = new GlobalScope()

  buildFuncGraph({ graph, ast, parent: globalScope, isFuncScope: true })

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
  linkSequentialNodes({ scope, ...props })

  buildChildrenScope({ scope, ...props })
  console.log(props.graph, scope)
}

interface BuildFuncGraphProps extends BuildGraphProps {
  scope: Scope
}

function linkSequentialNodes(props: BuildFuncGraphProps): void {
  const statements = extractAllStatements(props.ast)
  // Link nodes together: previous and next.
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
  // Empty for now.
  const scope = props.isFuncScope
    ? new FunctionScope(props.parent)
    : new BlockScope(props.parent)

  for (const st of statements) {
    // Add edges: find declarations or function calls.
    // If it has a block descendant
    // recursive call.
  }
}

buildGraph('./examples/hoisting/hoisting.js')
// buildGraph('./examples/sample-webserver/simple-webserver.js')
