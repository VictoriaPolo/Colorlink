import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'success'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-soft hover:shadow-soft-lg',
  secondary:
    'bg-white text-navy border border-slate-200 hover:border-primary hover:text-primary',
  ghost: 'bg-transparent text-body hover:bg-slate-100',
  success: 'bg-success text-white hover:brightness-95 shadow-soft',
}

const sizeClasses: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
