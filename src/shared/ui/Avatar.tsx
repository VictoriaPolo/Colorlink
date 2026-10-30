interface AvatarProps {
  nombre: string
  url?: string
  className?: string
}

/** Foto de perfil (Google/Facebook) si existe; si no, las iniciales sobre azul. */
export default function Avatar({ nombre, url, className = 'h-9 w-9 text-sm' }: AvatarProps) {
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (url) {
    return <img src={url} alt={nombre} referrerPolicy="no-referrer" className={`shrink-0 rounded-full object-cover ${className}`} />
  }
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white ${className}`}>
      {iniciales}
    </span>
  )
}
