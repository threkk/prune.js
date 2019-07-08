import { debuglog } from 'util'
const a = 'a'
const [b, c] = ['b', 'c']
const { d, e } = { d: 'd', e: 'e' }
const { d: f, e: g } = { d: 'd', e: 'e' }
const [ ...h ] = [a, b, c, d, e, f, g]

debuglog(a, b, c, d, e, f, g, h)
