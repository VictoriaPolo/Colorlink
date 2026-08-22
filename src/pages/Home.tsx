import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Clock, ShieldCheck, PlusCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import HeroIllustration from '../components/illustrations/HeroIllustration'
import { useSolicitudes } from '../context/SolicitudesContext'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Análisis inteligente',
    text: 'COLORLINK interpreta tu necesidad y sugiere una solución técnica adecuada.',
  },
  {
    icon: Clock,
    title: 'Respuesta rápida',
    text: 'Registra tu solicitud en minutos, sin formularios interminables.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguimiento transparente',
    text: 'Consulta el estado de tu solicitud en cada etapa del proceso.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { clienteActual, solicitudes } = useSolicitudes()

  const nombre = clienteActual.split(' ')[0]
  const recientes = solicitudes.slice(0, 3)
  const activas = solicitudes.filter((s) => s.estado !== 'Finalizada').length

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-surface-muted">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-slide-up">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={13} /> Plataforma inteligente de recubrimientos
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl">
              Convierte tu necesidad de pintura en una{' '}
              <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
                solución inteligente
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-body sm:text-lg">
              Cuéntanos qué necesitas. COLORLINK analizará la información y te ayudará a encontrar
              la solución técnica más adecuada.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" icon={<ArrowRight size={18} />} onClick={() => navigate('/solicitar')}>
                Comenzar solicitud
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/mis-solicitudes')}>
                Ver mis solicitudes
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-fade-in lg:max-w-none">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="flex flex-col gap-3 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <Icon size={22} />
              </span>
              <h3 className="text-base font-bold text-navy">{title}</h3>
              <p className="text-sm text-body">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* DASHBOARD DEL CLIENTE */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-navy">Hola, {nombre}</h2>
            <p className="mt-1 text-body">¿Qué solución necesitas hoy?</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy shadow-soft">
            Solicitudes activas: <span className="text-primary">{activas}</span>
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <button
            onClick={() => navigate('/solicitar')}
            className="group flex flex-col items-start justify-between gap-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-left transition-colors hover:border-primary hover:bg-blue-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white transition-transform group-hover:scale-105">
              <PlusCircle size={22} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-navy">Crear nueva solicitud</h3>
              <p className="mt-1 text-sm text-body">Registra una nueva necesidad de pintura en minutos.</p>
            </div>
          </button>

          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Tus solicitudes recientes
              </h3>
              <button
                onClick={() => navigate('/mis-solicitudes')}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Ver todas
              </button>
            </div>

            {recientes.length === 0 ? (
              <Card className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-400">
                Aún no tienes solicitudes registradas.
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {recientes.map((s) => (
                  <Card
                    key={s.id}
                    onClick={() => navigate(`/mis-solicitudes/${s.id}`)}
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4 transition-shadow hover:shadow-soft-lg"
                  >
                    <div>
                      <p className="text-sm font-bold text-navy">
                        {s.id} · {s.data.proyecto.tipoObra || 'Proyecto'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.data.proyecto.ciudad} · {s.fechaSolicitud}
                      </p>
                    </div>
                    <Badge estado={s.estado} />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
