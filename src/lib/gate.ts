import { getItem, setItem } from './storage'

// SHA-256 des Zugangscodes — der Code selbst steht nirgends im Quelltext.
const CODE_HASH = 'f686044080240ccbd16a5363cb8ca39278eae96da40506b09ffb40c6bf60861f'
const GATE_KEY = 'kbm.v1.gate'

export async function pruefeCode(eingabe: string): Promise<boolean> {
  const daten = new TextEncoder().encode(eingabe)
  const digest = await crypto.subtle.digest('SHA-256', daten)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hex === CODE_HASH
}

export function istFreigeschaltet(): boolean {
  return getItem<string>(GATE_KEY) === 'ok'
}

export function schalteFrei(): void {
  setItem(GATE_KEY, 'ok')
}
