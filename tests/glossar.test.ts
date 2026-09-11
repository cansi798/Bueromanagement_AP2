import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { GlossarEintrag } from '../src/types'

const glossar: GlossarEintrag[] = JSON.parse(
  readFileSync(join(__dirname, '..', 'public', 'data', 'glossar.json'), 'utf8'),
)

describe('Glossar-Inhalte', () => {
  it.each(['Geschäftsklima', 'Stabsstelleninhaber'])('enthält "%s"', (begriff) => {
    expect(glossar.some((e) => e.begriff === begriff)).toBe(true)
  })

  it('ist alphabetisch nach Begriff sortiert', () => {
    const namen = glossar.map((e) => e.begriff)
    expect(namen).toEqual([...namen].sort((a, b) => a.localeCompare(b, 'de')))
  })
})
