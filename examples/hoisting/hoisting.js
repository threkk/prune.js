foo()

function foo() {
  console.log('foo')
  function bar() {
    console.log(foobar)
  }
  var foobar = 'foobar'
  bar()
}
