import fs from 'node:fs'
import path from 'node:path'
import {parse as parseYaml} from 'yaml'
import {checklistManifestSchema} from './checklistManifest.js'

export type ChecklistItemOut = {
  moduleId: string
  id?: string
  text: string
  /** pending até o utilizador marcar em fluxos futuros; no MVP manual é sempre pending no JSON inicial */
  state: 'pending' | 'pass' | 'fail'
}

export function loadChecklistForModule(cwd: string, moduleId: string): ChecklistItemOut[] {
  const p = path.join(cwd, 'modules', moduleId, 'validation-checklist.yaml')
  if (!fs.existsSync(p)) {
    return []
  }
  const raw = fs.readFileSync(p, 'utf8')
  const parsed = parseYaml(raw)
  const m = checklistManifestSchema.safeParse(parsed)
  if (!m.success) {
    return []
  }
  return m.data.items.map((it, i) => ({
    moduleId,
    id: it.id ?? `item-${i + 1}`,
    text: it.text,
    state: 'pending' as const,
  }))
}

export function formatManualChecklistHuman(items: ChecklistItemOut[]): string {
  if (items.length === 0) {
    return 'Nenhum validation-checklist.yaml encontrado nos módulos ativos.\n'
  }
  const lines: string[] = ['Checklist manual de validação (marque mentalmente ou em notas):', '']
  let n = 1
  for (const it of items) {
    lines.push(`  ${n}. [${it.moduleId}] ${it.text}`)
    lines.push(`      (id: ${it.id ?? 'n/a'}, estado: ${it.state})`)
    n++
  }
  lines.push('')
  lines.push('Notas: pode anotar falhas ao lado de cada passo; em JSON use --output json para itens estruturados.')
  return lines.join('\n')
}
