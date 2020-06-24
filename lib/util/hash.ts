import { createHash, Hash } from 'crypto'
import { Node } from 'estree'

export default function hash(node: Node): string {
  const hasher: Hash = createHash('md5')
  const { type, loc } = node
  const input = JSON.stringify({ type, loc })

  hasher.update(input)
  return hasher.digest('base64')
}
