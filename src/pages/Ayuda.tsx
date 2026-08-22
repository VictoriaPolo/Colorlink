import { HelpCircle, MessageCircle, FileText, Sparkles } from 'lucide-react'
import Card from '../components/ui/Card'

const PREGUNTAS = [
  {
    q: '¿Qué es COLORLINK?',
    a: 'Es una plataforma inteligente que convierte tu necesidad de pintura o recubrimiento en una solución técnica recomendada, de forma rápida y sencilla.',
  },
  {
    q: '¿Necesito conocimientos técnicos para solicitar una solución?',
    a: 'No. Si no estás seguro de alguna respuesta, puedes elegir la opción "No estoy seguro" y nuestro sistema te ayudará a identificar la mejor alternativa.',
  },
  {
    q: '¿Qué pasa después de enviar mi solicitud?',
    a: 'COLORLINK analiza la información y genera una recomendación preliminar. Luego, tu solicitud continúa con validación técnica y disponibilidad de materiales.',
  },
  {
    q: '¿Puedo hacer seguimiento de mi solicitud?',
    a: 'Sí, en la sección "Mis solicitudes" puedes ver el estado y el avance de cada una de tus solicitudes en tiempo real.',
  },
]

export default function Ayuda() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
          <HelpCircle size={24} />
        </span>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">¿En qué podemos ayudarte?</h1>
        <p className="mt-2 text-body">Resolvemos las dudas más comunes sobre COLORLINK.</p>
      </div>

      <div className="flex flex-col gap-4">
        {PREGUNTAS.map(({ q, a }) => (
          <Card key={q} className="flex gap-3 p-5">
            <Sparkles className="mt-0.5 shrink-0 text-primary" size={18} />
            <div>
              <h3 className="text-sm font-bold text-navy">{q}</h3>
              <p className="mt-1 text-sm text-body">{a}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 flex flex-col items-center gap-3 p-8 text-center">
        <MessageCircle className="text-teal" size={26} />
        <h3 className="text-base font-bold text-navy">¿Aún tienes dudas?</h3>
        <p className="text-sm text-body">
          Escríbenos por WhatsApp o inicia una solicitud y nuestro equipo te acompañará en el proceso.
        </p>
        <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <FileText size={14} /> Prototipo académico — sin backend conectado
        </span>
      </Card>
    </div>
  )
}
