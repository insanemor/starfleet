import fs from 'node:fs'
import path from 'node:path'
import {starfleetDir} from '../state/paths.js'

export type ValidationReportFile = {
  generatedAt: string
  smoke?: unknown[]
  integration?: unknown[]
  manual?: unknown[]
}

export function writeValidationReport(cwd: string, report: ValidationReportFile): string {
  const dir = starfleetDir(cwd)
  fs.mkdirSync(dir, {recursive: true})
  const p = path.join(dir, 'validation-report.json')
  fs.writeFileSync(p, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return p
}
