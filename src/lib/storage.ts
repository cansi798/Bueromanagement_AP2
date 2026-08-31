// Versionierte, fehlertolerante localStorage-Hülle.
// Aufrufer übergeben voll qualifizierte Keys (kbm.v1.*).

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function storageVerfuegbar(): boolean {
  try {
    const testKey = 'kbm.v1.__test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}
