// Export list
var myFunctionA, myVariableA = null
export { myFunctionA, myVariableA }

// Named exports
// export individual features (can export var, let, const, function, class)
export let myVariableB = Math.sqrt(2)
export function myFunctionB() { }
export class MyClassB { }

// Destruction exports
const o = { a: 'a', b: 'b' }
export const {a, b} = o

// Default exports
// export feature declared earlier as default
export { myFunctionA as default }

// Export anonymous features as default
export default function() { }
export default class {}


// Aggregating modules
export * from ''
export { name1, name2, nameN } from ''
export { import1 as name1, import2 as name2 } from  ''
export { default } from ''
