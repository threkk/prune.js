import { SourceLocation } from 'acorn'
import { PathLike } from 'fs'

export interface Finding {
  file: PathLike
  location: SourceLocation
  raw: string
  reason?: string
}

export class Findings {
  private findings: Finding[]

  add(f: Finding) {
    this.findings.push(f)
  }

  getFindings(): Finding[] {
    return this.findings
  }
}
