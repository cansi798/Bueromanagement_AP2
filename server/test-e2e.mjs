// End-to-End-Test des Backends gegen eine lokale Installation.
// Aufruf: node server/test-e2e.mjs [basis-url]   (Standard: http://localhost:8090)
// Voraussetzung: frische DB (schema.sql importiert), config.php mit
// setup_key 'lokal-setup-123' und mail_debug_datei '/tmp/kbm-mails.txt'.
import { readFileSync } from 'node:fs'

const BASIS = process.argv[2] ?? 'http://localhost:8090'
const MAILS = '/tmp/kbm-mails.txt'
let ok = 0
let fehler = 0

function melde(name, bestanden, detail = '') {
  if (bestanden) { ok++; console.log(`  ✓ ${name}`) }
  else { fehler++; console.log(`  ✗ ${name} ${detail}`) }
}

// Mini-HTTP-Client mit Cookie-Jar pro "Person".
function client() {
  let cookie = ''
  return async (pfad, { method = 'GET', json, form } = {}) => {
    const headers = { Origin: BASIS }
    if (cookie) headers.Cookie = cookie
    let body
    if (json) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(json) }
    if (form) { headers['Content-Type'] = 'application/x-www-form-urlencoded'; body = new URLSearchParams(form).toString() }
    const res = await fetch(`${BASIS}/${pfad}`, { method, headers, body, redirect: 'manual' })
    const setzt = res.headers.get('set-cookie')
    if (setzt) cookie = setzt.split(';')[0]
    const text = await res.text()
    let daten = {}
    try { daten = JSON.parse(text) } catch { daten = { _text: text } }
    return { status: res.status, daten }
  }
}

const rechne = (frage) => {
  const [a, op, b] = frage.split(' ')
  return op === '+' ? +a + +b : +a * +b
}

async function captchaLoesen(c) {
  const { daten } = await c('server/api/captcha.php')
  return rechne(daten.frage)
}

function letzterMailTreffer(regex) {
  try {
    const treffer = [...readFileSync(MAILS, 'utf8').matchAll(regex)]
    return treffer.at(-1)?.[1] ?? null
  } catch { return null }
}

console.log(`\n🧪 E2E gegen ${BASIS}\n`)

// ── 1. Erstinstallation ──────────────────────────────────────────
console.log('1) Erstinstallation')
const admin = client()
let r = await admin('server/install.php', { method: 'POST', form: {
  setup_key: 'lokal-setup-123', name: 'Frau Test', email: 'admin@test.de', passwort: 'admin-geheim-1' } })
melde('Admin angelegt', r.status === 200 && /Admin angelegt/.test(r.daten._text ?? ''), `status=${r.status}`)

// ── 2. Admin-Login mit Captcha + 2FA per Mail ────────────────────
console.log('2) Admin-Login (Captcha + 2FA)')
r = await admin('server/api/login.php', { method: 'POST', json: {
  email: 'admin@test.de', passwort: 'admin-geheim-1', captcha: await captchaLoesen(admin) } })
melde('Passwort-Schritt liefert zwei_fa', r.status === 200 && r.daten.zwei_fa === true, JSON.stringify(r.daten))
const code2fa = letzterMailTreffer(/Anmeldecode lautet: (\d{6})/g)
melde('2FA-Code kam per (Debug-)Mail an', Boolean(code2fa))
r = await admin('server/api/login-2fa.php', { method: 'POST', json: { email: 'admin@test.de', code: code2fa } })
melde('2FA-Login erfolgreich', r.status === 200 && r.daten.nutzer?.rolle === 'admin', JSON.stringify(r.daten))

// ── 3. Klassen + Nutzer anlegen ──────────────────────────────────
console.log('3) Klasse, Schüler (JSON-Import), Lehrkraft')
r = await admin('server/api/admin/klassen.php', { method: 'POST', json: { name: 'KBM 2026' } })
melde('Klasse angelegt', r.status === 201)
const klasseId = r.daten.id
r = await admin('server/api/admin/nutzer.php', { method: 'POST', json: {
  klasse_id: klasseId, mitglieder: [
    { email: 'anna@test.de', name: 'Anna A.' },
    { email: 'ben@test.de', name: '<img src=x onerror=alert(1)>' }, // XSS-Kandidat
  ] } })
melde('2 Schüler per JSON-Import', r.status === 201 && r.daten.angelegt?.length === 2, JSON.stringify(r.daten.fehler))
const annaPw = r.daten.angelegt?.[0]?.passwort
r = await admin('server/api/admin/nutzer.php', { method: 'POST', json: {
  klasse_id: klasseId, rolle: 'lehrer', mitglieder: [{ email: 'lehrer@test.de', name: 'Herr L.' }] } })
melde('Lehrkraft angelegt + zugeordnet', r.status === 201 && r.daten.angelegt?.[0]?.rolle === 'lehrer')
const lehrerPw = r.daten.angelegt?.[0]?.passwort
r = await admin('server/api/admin/nutzer.php', { method: 'POST', json: {
  klasse_id: klasseId, rolle: 'admin', mitglieder: [{ email: 'boese@test.de' }] } })
melde('Rolle "admin" NICHT anlegbar (wird schueler)', r.daten.angelegt?.[0]?.rolle === 'schueler')

// ── 4. Schüler-Login + Fortschritt ───────────────────────────────
console.log('4) Schülerin: Login, Fortschritt speichern/laden')
const anna = client()
r = await anna('server/api/login.php', { method: 'POST', json: {
  email: 'anna@test.de', passwort: annaPw, captcha: await captchaLoesen(anna) } })
melde('Schüler-Login (ohne 2FA)', r.status === 200 && r.daten.nutzer?.rolle === 'schueler', JSON.stringify(r.daten))
const fortschritt = { 'kbm.v1.fortschritt': { erledigteAufgaben: ['kbz-2025s-a1-1'],
  aufgabenStatistik: { 'kbz-2025s-a1-1': { richtig: 0, falsch: 2 } },
  quizErgebnisse: {}, simulationen: [], streak: { letzterTag: new Date().toISOString().slice(0,10), tage: 1 } } }
r = await anna('server/api/fortschritt.php', { method: 'PUT', json: fortschritt })
melde('Fortschritt speichern (PUT)', r.status === 200)
r = await anna('server/api/fortschritt.php')
melde('Fortschritt laden (GET)', r.daten.daten?.['kbm.v1.fortschritt']?.erledigteAufgaben?.[0] === 'kbz-2025s-a1-1')

// ── 5. Rechte-Grenzen ────────────────────────────────────────────
console.log('5) Negativtests: Rechte')
r = await anna('server/api/admin/klassen.php')
melde('Schüler ⛔ Admin-Endpoint (403)', r.status === 403, `status=${r.status}`)
r = await anna('server/api/lehrer/statistik.php?klasse_id=' + klasseId)
melde('Schüler ⛔ Lehrer-Endpoint (403)', r.status === 403, `status=${r.status}`)

// ── 6. Lehrkraft: Klassen + Live-Statistik ───────────────────────
console.log('6) Lehrkraft: Statistik der Klasse')
const lehrer = client()
r = await lehrer('server/api/login.php', { method: 'POST', json: {
  email: 'lehrer@test.de', passwort: lehrerPw, captcha: await captchaLoesen(lehrer) } })
melde('Lehrer-Login', r.status === 200 && r.daten.nutzer?.rolle === 'lehrer')
r = await lehrer('server/api/lehrer/klassen.php')
melde('Lehrer sieht seine Klasse', r.daten.klassen?.some((k) => k.id === klasseId))
r = await lehrer('server/api/lehrer/statistik.php?klasse_id=' + klasseId)
const anna_stat = r.daten.mitglieder?.find((m) => m.email === 'anna@test.de')
melde('Statistik: Annas Übungsstand sichtbar', anna_stat?.geuebt === 1 && anna_stat?.quote === 0, JSON.stringify(anna_stat))
melde('Statistik: Problem-Aufgabe der Klasse erkannt', r.daten.klasse?.problemAufgaben?.[0]?.aufgabeId === 'kbz-2025s-a1-1')
r = await lehrer('server/api/lehrer/statistik.php?klasse_id=99999')
melde('Lehrer ⛔ fremde Klasse (403)', r.status === 403, `status=${r.status}`)

// ── 7. Sperre nach 3 Fehlversuchen ───────────────────────────────
console.log('7) Brute-Force-Sperre')
const angreifer = client()
for (let i = 0; i < 3; i++) {
  r = await angreifer('server/api/login.php', { method: 'POST', json: {
    email: 'anna@test.de', passwort: 'falsch-' + i, captcha: await captchaLoesen(angreifer) } })
}
melde('Nach 3 Fehlversuchen: 423 gesperrt', r.status === 423, `status=${r.status}`)
r = await angreifer('server/api/login.php', { method: 'POST', json: {
  email: 'anna@test.de', passwort: annaPw, captcha: await captchaLoesen(angreifer) } })
melde('Auch mit RICHTIGEM Passwort gesperrt', r.status === 423, `status=${r.status}`)

// ── 8. Passwort-Reset per Mail ───────────────────────────────────
console.log('8) Passwort-Reset (hebt Sperre auf)')
r = await angreifer('server/api/passwort-vergessen.php', { method: 'POST', json: {
  email: 'anna@test.de', captcha: await captchaLoesen(angreifer) } })
melde('Reset-Mail angefordert', r.status === 200)
const token = letzterMailTreffer(/token=([a-f0-9]{64})/g)
melde('Reset-Link mit Token in Mail', Boolean(token))
r = await angreifer('server/api/passwort-neu.php', { method: 'POST', json: { token, passwort: 'neues-pass-99' } })
melde('Neues Passwort gesetzt', r.status === 200, JSON.stringify(r.daten))
const anna2 = client()
r = await anna2('server/api/login.php', { method: 'POST', json: {
  email: 'anna@test.de', passwort: 'neues-pass-99', captcha: await captchaLoesen(anna2) } })
melde('Login mit neuem Passwort (Sperre aufgehoben)', r.status === 200 && !!r.daten.nutzer)

// ── 9. Captcha-Pflicht + CSRF-Origin ─────────────────────────────
console.log('9) Schutzmechanismen')
r = await client()('server/api/login.php', { method: 'POST', json: {
  email: 'anna@test.de', passwort: 'neues-pass-99', captcha: 99 } })
melde('Falsches Captcha ⛔', r.status === 400)
const fremd = client()
{
  const res = await fetch(`${BASIS}/server/api/logout.php`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://boese-seite.de' } })
  melde('Fremde Origin ⛔ (403)', res.status === 403, `status=${res.status}`)
}
{
  const res = await fetch(`${BASIS}/server/api/config.php`)
  const text = await res.text()
  melde('config.php gibt nichts preis', !text.includes('kbm-lokal-test'), `len=${text.length}`)
}
r = await fremd('server/install.php', { method: 'POST', form: {
  setup_key: 'lokal-setup-123', email: 'x@x.de', passwort: 'aaaaaaaa' } })
melde('install.php nach Setup deaktiviert/gelöscht', r.status === 403 || r.status === 404, `status=${r.status}`)

console.log(`\n▶ Ergebnis: ${ok} bestanden, ${fehler} fehlgeschlagen\n`)
process.exit(fehler === 0 ? 0 : 1)
