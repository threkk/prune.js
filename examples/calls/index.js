function f (a, b, ...c) {}

const v = 1
const w = 2
const x = 3
const y = { a: 1 }
const z = () => () => {}

f(z()(), y, x, w, v)
