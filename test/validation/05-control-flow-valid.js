const foo = [1, 2, 3, 4, 5]
const bar = 10

function foobar(f, b) {
  let acc = 0
  for (let i = 0; i < foo.length; i++) {
    acc += foo[i] * bar
  }
  return acc
}

foobar(foo, bar)
