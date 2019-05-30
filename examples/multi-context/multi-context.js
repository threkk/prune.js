const a = 1

function b () {
  const a = 2
  console.log(`Inside function: ${a}`)
}

console.log(`Outside function: ${a}`)
b()
