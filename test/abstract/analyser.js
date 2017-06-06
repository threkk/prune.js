/* global describe it */
const { expect } = require('chai')
const AbstractAnalyser = require('../../src/abstract/analyser')

describe('AbstractAnalyser', () => {
  describe('#constructor()', () => {
    it('throws an exception when instantiated', () => {
      expect(() => new AbstractAnalyser()).to.throw(TypeError)
    })

    it('requires to implement `analyse`.', () => {
      class DummyAnalyser extends AbstractAnalyser {}
      expect(() => new DummyAnalyser()).to.throw(TypeError)
    })

    it('`analyse` is a function.', () => {
      class DummyAnalyser extends AbstractAnalyser {
        analyse () {
          return 'Function'
        }
      }

      expect(() => new DummyAnalyser()).to.not.throw(TypeError)

      const dummy = new DummyAnalyser()
      expect(dummy).to.have.property('analyse')
      expect(dummy.analyse).to.be.an.instanceOf(Function)
    })
  })
})
