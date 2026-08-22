import { Sparkles } from 'lucide-react'

export default function HelpHint({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
      <Sparkles size={14} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  )
}
