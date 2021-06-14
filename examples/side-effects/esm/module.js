const sideEffect = 'foo'
const exported = 'bar'

function f() {
  console.log(sideEffect)
}

export default function g() {
  console.log(exported)
}

f()
