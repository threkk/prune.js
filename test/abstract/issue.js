/* global describe it */
const { expect, should } = require('chai')
const AbstractIssue = require('../../src/abstract/issue')

should()

describe('AbstractIssue', () => {
  describe('#constructor()', () => {
    it('throws an exception when instantiated', () => {
      expect(() => new AbstractIssue()).to.throw(TypeError)
    })

    it('throws an exception if the type is invalid', () => {
      class DummyIssue extends AbstractIssue {
        constructor () {
          super('invalid type')
        }
      }

      expect(() => new DummyIssue()).to.throw(TypeError)
    })
  })

  describe('#static', () => {
    it('implements getters for "CODE", "DEPENDENCY", "ERROR" and "MODULE"', () => {
      expect(AbstractIssue).to.have.property('CODE')
      expect(AbstractIssue).to.have.property('DEPENDENCY')
      expect(AbstractIssue).to.have.property('ERROR')
      expect(AbstractIssue).to.have.property('MODULE')

      AbstractIssue.CODE.should.be.an.instanceOf(Symbol)
      AbstractIssue.DEPENDENCY.should.be.an.instanceOf(Symbol)
      AbstractIssue.ERROR.should.be.an.instanceOf(Symbol)
      AbstractIssue.MODULE.should.be.an.instanceOf(Symbol)
    })
  })
})
