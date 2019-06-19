import { PathLike } from 'fs'
import { loadFile, createASTParser } from './ast'
import { extractStatements } from './visitor/statements'
import { StatementNode, Relation, Relationship, hash } from './call-graph'
import { Graph } from '../util/graph'
import { FunctionScope, Scope } from './scope'

export async function buildGraph(path: PathLike): Promise<Graph> {
  const parse = createASTParser(false)
  const graph = new Graph()
  const file = await loadFile(path)
  const ast = parse(file)
  const globalScope = new FunctionScope()

  await buildFunctionGraph({ graph, ast, scope: globalScope })

  return graph
}

interface BuildGraphProps {
  graph: Graph
  scope: Scope
  ast: acorn.Node
}

async function buildFunctionGraph(props: BuildGraphProps) {
  const statements = await extractStatements(props.ast)
  // Empty for now.
  const scope = new FunctionScope(props.scope)

  // Link nodes together: previous and next.
  statements.forEach((st, i, arr) => {
    const currentNode = new StatementNode(st, scope)
    props.graph.addNode(currentNode)

    if (i > 0) {
      const prevNodeId = hash(arr[i - 1])
      const prevNode = props.graph.getNode(prevNodeId)

      props.graph.addEdge(
        new Relation(prevNode, currentNode, Relationship.NEXT)
      )

      props.graph.addEdge(
        new Relation(currentNode, prevNode, Relationship.PREVIOUS)
      )
    }
  })
}

buildGraph('./examples/sample-webserver/simple-webserver.js').then(console.log)
