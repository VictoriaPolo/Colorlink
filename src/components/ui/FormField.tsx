import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  help?: string
  icon?: ReactNode
  children: ReactNode
}

export default function FormField({ label, required, error, help, icon, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
        {icon}
        {label}
        {required && <span className="text-primary">*</span>}
      </span>
      {children}
      {help && !error && <span className="text-xs text-slate-400">{help}</span>}
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </label>
  )
}

const baseControl =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-blue-100'

export function controlClass(hasError?: boolean) {
  return `${baseControl} ${hasError ? 'border-red-300' : 'border-slate-200'}`
}
