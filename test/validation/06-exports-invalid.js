// Exporting individual features
export let name1, name2, name3
export let name4 = 1,
  name5 = 2
export function functionName() {}
export class ClassName {}

// Export list
const name6 = 1
const variable1 = 1
const variableA = 2
const name7 = 2
const nameC = 5
const name8 = 3
export { name6, name7, name8 }

// Renaming exports
export { variable1 as name9, variableA as nameB, nameC }

// Exporting destructured assignments with renaming
export const { nameD, nameE: bar } = o

// Default exports
// export default expression;
// export default function () {} // also class, function*
export default function nameF() {} // also class, function*
// export { nameG as default };

// Aggregating modules
// export * from name1; // does not set the default export
// export * as nameH from name2; // Draft ECMAScript® 2O21
// export { nameJ, nameK, nameL } from name;
// export { import1 as nameM, importN as nameO, nameP } from name;
// export { default } from name;
