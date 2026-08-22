import type { HTMLAttributes } from 'react'

export default function Card({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-white border border-slate-100 shadow-soft ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
