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
