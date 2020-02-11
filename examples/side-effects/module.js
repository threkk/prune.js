const sideEffect = 'foo'
const exported = 'bar'

function f() {
  console.log(sideEffect)
}

function g() {
  console.log(exported)
}

f()

module.exports = g
