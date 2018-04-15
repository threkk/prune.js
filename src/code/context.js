const _ = require('underscore')
const Trace = require('./trace')

const contains = (el, arr) => {
  for (let a of arr) {
    if (el.isEquals(a)) {
      return true
    }
  }
  return false
}

class Context {
  constructor (context, remanent) {
    this.context = context
    this.notUsed = remanent
    this.used = []
    this.children = []
  }

  analyse () {
    const trace = new Trace(this.context, this.notUsed)
    const { notUsed, used } = trace.analyse()

    this.notUsed = this.notUsed.concat(notUsed)
    this.used = used

    // For each node in the context, get children and repeat. Need to find a way
    // to combine the responses (and to make them parallel with promises).
    // Not used contains the accumulated not used nodes from the remanent and
    // the current context.
    this.children = used.map(u => u.children)

    if (this.children.length === 0) {
      // Stop case
      return this.notUsed
    } else {
      return this.combinedNotUsed()
    }
  }

  combinedNotUsed () {
    // console.log(this.notUsed)
    const childrenResult = this.children.map(child => {
      const childContext = new Context(child, this.notUsed)
      return childContext.analyse()
    })

    const allResults = _.flatten(childrenResult)

    const intersection = []
    for (let result of allResults) {
      let isCommon = true
      for (let childResults of childrenResult) {
        if (!contains(result, childResults)) {
          isCommon = false
          break
        }
      }
      if (isCommon) {
        intersection.push(result)
      }
    }

    const uniqueNotUsed = []
    for (let node of intersection) {
      if (!contains(node, uniqueNotUsed)) {
        uniqueNotUsed.push(node)
      }
    }

    // return final unused nodes in this context.
    return uniqueNotUsed
  }
}

module.exports = Context
