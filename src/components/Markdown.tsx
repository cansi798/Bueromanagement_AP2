import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { verlinkeParagraphen } from '../lib/paragraphen'

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_strong]:font-semibold [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-600 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-600 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800 [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_blockquote]:rounded-r-lg [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:bg-amber-50 [&_blockquote]:px-3 [&_blockquote]:py-2 dark:[&_blockquote]:border-amber-600 dark:[&_blockquote]:bg-amber-950/30">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Externe Links (v. a. §-Verweise) im neuen Tab; im Druck wie
          // normaler Text, damit Skript-PDFs ruhig bleiben.
          a: ({ node: _n, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 underline decoration-dotted underline-offset-2 hover:decoration-solid dark:text-sky-300 print:text-inherit print:no-underline"
            />
          ),
        }}
      >
        {verlinkeParagraphen(text)}
      </ReactMarkdown>
    </div>
  )
}
