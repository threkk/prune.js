class A {

}

class B extends A {
  constructor() {
    super()
    this.a = 'a'
  }
}

const b = new B()
console.log(b.a)
