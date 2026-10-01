import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import Markdown from '../src/components/Markdown'

describe('Markdown mit §-Links', () => {
  it('rendert Gesetzesverweise als externe Links', () => {
    const html = renderToString(<Markdown text="Grundlage ist § 433 BGB." />)
    expect(html).toContain('href="https://www.gesetze-im-internet.de/bgb/__433.html"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('§ 433 BGB')
  })

  it('lässt Text ohne Verweise unverändert', () => {
    const html = renderToString(<Markdown text="Nur normaler Text." />)
    expect(html).not.toContain('gesetze-im-internet.de')
  })
})

describe('Markdown-Zeilenumbrüche (Rechenwege)', () => {
  it('rendert einfache Zeilenumbrüche als <br>', () => {
    const html = renderToString(
      <Markdown text={'Skonto 2 % von 9.240,00 € = 184,80 €.\n9.240,00 € − 184,80 € = 9.055,20 €'} />,
    )
    expect(html).toMatch(/184,80 €\.<br\/?>/)
  })

  it('lässt Absätze, Tabellen und KaTeX intakt', () => {
    const html = renderToString(
      <Markdown text={'Absatz A\n\nAbsatz B\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n$x = 1$'} />,
    )
    expect(html.match(/<p>/g)?.length).toBeGreaterThanOrEqual(2)
    expect(html).toContain('<table>')
    expect(html).toContain('katex')
  })
})
