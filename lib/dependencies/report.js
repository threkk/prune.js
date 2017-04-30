const Report = require('../project/report')

const DependencyType = {
  DEP: Symbol('Dependency'),
  DEV: Symbol('Dev-dependency'),
  MIS: Symbol('Missing')
}

class DependencyReport extends Report {
  constructor (depType, name) {
    super(Report.DEPENDENCY())
    this.depType = depType
    this.name = name
  }

  display () {
    let msg
    if (this.depType === DependencyType.DEP) {
      msg = `The dependency ${this.name} is not used.`
    } else if (this.depType === DependencyType.DEV) {
      msg = `The dev-dependency ${this.name} is not used.`
    } else if (this.depType === DependencyType.MIS) {
      msg = `The package ${this.name} has been found in the node_modules but ` +
            `it is not in the package.json`
    }
    return msg
  }
}

module.exports = DependencyReport
