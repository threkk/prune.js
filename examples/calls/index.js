function f (a, b, { c }, ...d) {
  console.log(a, b, c, d)
}

const v = 'd2'
const w = 'd1'
const x = { c: 'c' }
const y = 'b'
const z = () => () => 'a'

f(z()(), y, x, w, v)
