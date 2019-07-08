// On the left...

const obj = {
  a: {
    'a1': 1,
    'a2': 2
  },
  b: 'b',
  c: 'c'
}

console.log(obj)

const obj2 = {
  ...obj,
  d: 'd'
}

// And on the right...
obj2.e = 'e'
obj2.f = {
  'f1': 1,
  'f2': 2
}

obj2.f['f3'] = 3

console.log(obj2)
