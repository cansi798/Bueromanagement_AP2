import { zerlegeZuordnungsOption } from '../lib/aufgabenText'

// Stellt eine Antwortoption dar — Zuordnungsketten ("a) 2, b) 1, …")
// als übersichtliche Chips statt einer langen Kommazeile.
export default function OptionText({ text }: { text: string }) {
  const zuordnung = zerlegeZuordnungsOption(text)
  if (zuordnung) {
    return (
      <span className="flex flex-wrap gap-1.5">
        {zuordnung.map((teil, i) => {
          const [buchstabe, ...rest] = teil.split(')')
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-sm"
            >
              <b>{buchstabe})</b> {rest.join(')').trim()}
            </span>
          )
        })}
      </span>
    )
  }
  return <span className="whitespace-pre-line">{text}</span>
}
