function f (f1) {
  console.log(f1)
}

f('f1')

////////

;(function(f2) { console.log(f2) })('f2')

///////

;(f3 => console.log(f3))('f3')

///////

class C1 {
  constructor(c1) {
    console.log(c1)
  }
}

new C1('c1')

///////

class C2 extends C1 {
  constructor(c2) {
    super(c2)
    console.log(c2)
  }
}

new C2('c2')

//////

;new (class {
  constructor(c3) {
    console.log(c3)
  }
})('c3')
