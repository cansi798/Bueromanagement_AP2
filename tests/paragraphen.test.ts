import { describe, it, expect } from 'vitest'
import { verlinkeParagraphen } from '../src/lib/paragraphen'

describe('verlinkeParagraphen', () => {
  it('verlinkt einfache §-Verweise', () => {
    expect(verlinkeParagraphen('Kaufvertrag: § 433 BGB regelt die Pflichten.')).toBe(
      'Kaufvertrag: [§ 433 BGB](https://www.gesetze-im-internet.de/bgb/__433.html) regelt die Pflichten.',
    )
  })

  it('verlinkt ohne Leerzeichen nach §', () => {
    expect(verlinkeParagraphen('§433 BGB')).toBe(
      '[§433 BGB](https://www.gesetze-im-internet.de/bgb/__433.html)',
    )
  })

  it('nimmt Abs./Satz/Nr. mit in den Linktext, URL zeigt auf den §', () => {
    expect(verlinkeParagraphen('§ 622 Abs. 2 BGB')).toBe(
      '[§ 622 Abs. 2 BGB](https://www.gesetze-im-internet.de/bgb/__622.html)',
    )
  })

  it('unterstützt Buchstaben-Paragraphen', () => {
    expect(verlinkeParagraphen('§ 312g BGB')).toBe(
      '[§ 312g BGB](https://www.gesetze-im-internet.de/bgb/__312g.html)',
    )
  })

  it('verlinkt §§-Bereiche auf den ersten Paragraphen', () => {
    expect(verlinkeParagraphen('§§ 433 ff. BGB')).toBe(
      '[§§ 433 ff. BGB](https://www.gesetze-im-internet.de/bgb/__433.html)',
    )
  })

  it('verlinkt GG-Artikel', () => {
    expect(verlinkeParagraphen('Art. 14 GG schützt das Eigentum.')).toBe(
      '[Art. 14 GG](https://www.gesetze-im-internet.de/gg/art_14.html) schützt das Eigentum.',
    )
  })

  it('nutzt die Sonder-Slugs der Gesetze', () => {
    expect(verlinkeParagraphen('§ 5 UStG')).toContain('/ustg_1980/__5.html')
    expect(verlinkeParagraphen('§ 14 BBiG')).toContain('/bbig_2005/__14.html')
    expect(verlinkeParagraphen('§ 3 MuSchG')).toContain('/muschg_2018/__3.html')
  })

  it('lässt unbekannte Gesetzeskürzel unangetastet', () => {
    const t = '§ 5 SGB regelt etwas; § 3 XYZG auch.'
    expect(verlinkeParagraphen(t)).toBe(t)
  })

  it('lässt § ohne Gesetzeskürzel unangetastet', () => {
    const t = 'Siehe § 12 des Vertrags.'
    expect(verlinkeParagraphen(t)).toBe(t)
  })

  it('fasst Codeblöcke und Inline-Code nicht an', () => {
    const t = 'Code: `§ 433 BGB` und\n```\n§ 433 BGB\n```\nfertig.'
    expect(verlinkeParagraphen(t)).toBe(t)
  })

  it('verlinkt bereits verlinkte Verweise nicht doppelt', () => {
    const t = '[§ 433 BGB](https://example.org)'
    expect(verlinkeParagraphen(t)).toBe(t)
  })
})
