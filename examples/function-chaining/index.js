function a () {
  console.log('Function chain: c -> b -> a')
}

function b () {
  a()
}

function c() {
  b()
}

c()

