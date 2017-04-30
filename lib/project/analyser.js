/**
* Parent abstract class.
* @abstract
*/
class Analyser {
  /** @constructor */
  constructor () {
    if (new.target === Analyser) {
      throw TypeError('new of abstract class Analyser')
    }

    if (this.analyse === undefined || typeof this.analyse !== 'function') {
      throw new TypeError('The method `analyse` is not defined.')
    }
  }
}

module.exports = Analyser
