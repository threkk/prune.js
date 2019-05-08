const notExported = 'foo'
const exported = 'bar'

function f() {
  console.log(notExported)
}

function g() {
  console.log(exported)
}

module.exports = g
