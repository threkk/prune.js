import { createHash, Hash } from 'crypto'
import { Node } from 'estree'

export default function hash(node: Node | string, path?: string): string {
  const hasher: Hash = createHash('md5')

  let input: string
  if (typeof node === 'string') {
    input = node
  } else {
    const { type, loc } = node
    input = JSON.stringify({ type, loc })
  }

  if (path) {
    input += path
  }

  hasher.update(input)
  return hasher.digest('base64')
}
