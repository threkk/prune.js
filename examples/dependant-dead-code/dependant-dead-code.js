// This example would mark the variable c as unused.
// However, the whole fragment should be marked as dead code given that there is
// no output.
function sum (a, b) {
    return a + b
}

const a = 1
const b = 2
const c = sum(a, b)
