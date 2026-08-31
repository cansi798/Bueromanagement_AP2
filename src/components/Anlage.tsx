import Markdown from './Markdown'

// Stellt Prüfungsanlagen (Belege, Rechnungen, Gesetzesauszüge, Tabellen) im
// Dokument-Look dar: Kopfzeile, Papier-Optik, erhaltene Zeilenumbrüche und
// horizontal scrollbare Tabellen für Mobilgeräte.
export default function Anlage({ text, titel = 'Anlage' }: { text: string; titel?: string }) {
  // Einfache Zeilenumbrüche als harte Markdown-Umbrüche erhalten — Belege und
  // Adressblöcke fallen sonst zu einem Absatz zusammen.
  const mitUmbruechen = text.replace(/\n(?!\n)/g, '  \n')

  return (
    <div className="overflow-hidden rounded-xl border-2 border-slate-300 shadow-sm">
      <p className="flex items-center gap-1.5 border-b-2 border-slate-300 bg-slate-200 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
        📎 {titel}
      </p>
      <div className="overflow-x-auto bg-white p-4">
        <div className="min-w-fit font-serif text-[14.5px] leading-relaxed [&_table]:my-2 [&_table]:border-collapse [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
          <Markdown text={mitUmbruechen} />
        </div>
      </div>
    </div>
  )
}
