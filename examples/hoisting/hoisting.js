foo()

bar()

export function bar() {
  console.log('bar')
}

function foo() {
  console.log('foo')
  function bar() {
    console.log(foobar)
  }
  var foobar = 'foobar'
  bar()
}
