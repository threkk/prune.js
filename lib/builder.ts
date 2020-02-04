import { PathLike } from 'fs'
import { loadFile, createScopeManager } from './ast'
import { extractAllStatements, onCallStatement } from './visitor/statements'
import { FunctionScope, Scope, BlockScope, ScopeVariable } from './scope'
import { extractBlockStatements } from './visitor/blocks'
import { Graph, StatementNode } from './graph'
import { getDeclarationSetters } from './register/declaration'
import { registerHoisted } from './register/hoisted'
import { getArgumentsSettersFromDecl } from './register/arguments'
import { findIdentifiers } from './visitor/expression'
import { linkVarWrite } from './linker/read-write'
import { LinkProps } from './linker/interfaces'
import { linkPropsWrite } from './linker/read-write-properties'
import { linkCallExpression } from './linker/functions'
import { traverse } from 'estraverse'

export function buildGraph(path: PathLike): Graph {
  const parse = createScopeManager(false)
  const graph = new Graph()
  const file = loadFile(path)
  const ast = parse(file)
  const scope = ast.globalScope

  console.log('==== Global Scopes:')
  console.log(ast.globalScope)

  const nodes = []
  traverse(scope.block, {
    enter: function(node) {
      if (/Statement|Declaration/.test(node.type)) {
        nodes.push([node.type, node.loc.start.line, node.loc.end.line])
        if (/Function/.test(node.type)) this.skip()
      }
    }
  })

  console.log(1)
  console.log(nodes)
  console.log(2)
  // buildFuncGraph({
  //   graph,
  //   ast,
  //   scope: globalScope,
  //   isFuncScope: true
  // })

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
  linkNodes(props)
  buildScope(props)
}

function linkNodes(props: BuildGraphProps): void {
  const statements = extractAllStatements(props.ast)

  statements.forEach(st => {
    const currentNode = new StatementNode({
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
    linkCallExpression(args)
  })
}

function buildScope(props: BuildGraphProps) {
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
        buildScope({ ...baseVariable, ast: (st as any).consequent })

        if ((st as any).alternate != null) {
          buildScope({ ...baseVariable, ast: (st as any).alternate })
        }
        break
      case 'SwitchStatement':
        buildScope({ ...baseVariable, ast: (st as any).cases })
        break
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
        buildScope({ ...baseVariable, ast: (st as any).body })
        break
      case 'TryStatement':
        const { block, handler, finalizer } = st as any
        buildScope({ ...baseVariable, ast: block })

        if (handler != null) {
          const newScope = new BlockScope(props.scope)
          findIdentifiers(handler.param).forEach(id => {
            // newScope.add(createErrorSetter(id, st))
          })

          buildScope({ ...baseVariable, scope: newScope, ast: handler })
        }

        if (finalizer != null) {
          buildScope({ ...baseVariable, ast: finalizer })
        }
        break
    }

    onCallStatement(
      st,
      props.scope,
      (_: Error, node: any, func: ScopeVariable) => {
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

        switch (node.callee.type) {
          case 'Identifier':
          case 'MemberExpression':
            if (func.callable.type !== 'Class') {
              scopeProps.ast = (func.callable as any).body
              if (func.callable.type === 'ArrowFunctionExpression') {
                scopeProps.scope = props.scope as FunctionScope
              }
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
      }
    )
  }
}
