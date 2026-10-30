import type { HTMLAttributes } from 'react'

export default function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-soft ${className}`} {...rest}>
      {children}
    </div>
  )
}
