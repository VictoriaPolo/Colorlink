import { useState } from 'react'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import Stepper from '@/shared/ui/Stepper'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import Step1Identificacion from './Step1Identificacion'
import Step2Proyecto from './Step2Proyecto'
import Step3Tecnica from './Step3Tecnica'
import Step4Evidencia from './Step4Evidencia'
import Processing from './Processing'
import Result from './Result'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useToast } from '@/shared/lib/toast'
import { wizardSchemas, primerosErrores } from '@/domain/solicitud/schemas'
import type { SolicitudFormData, Solicitud } from '@/domain/solicitud/types'

const STEPS = [
  { label: 'Identificación' },
  { label: 'Proyecto' },
  { label: 'Información técnica' },
  { label: 'Evidencia' },
  { label: 'Resultado' },
]

const emptyFormData: SolicitudFormData = {
  identificacion: { cliente: '', nit: '', responsable: '', canal: '' },
  proyecto: { ciudad: '', tipoObra: '', areaAprox: '', fechaRequerida: '' },
  tecnica: { superficie: '', ambiente: '', condicion: '', colorAcabado: '' },
  evidencia: { descripcion: '', imagenes: [], observaciones: '', consentimiento: false },
}

type WizardStep = 1 | 2 | 3 | 4 | 'processing' | 5

export default function WizardPage() {
  const { crearSolicitud } = useSolicitudes()
  const { mostrarToast } = useToast()
  const [step, setStep] = useState<WizardStep>(1)
  const [formData, setFormData] = useState<SolicitudFormData>(emptyFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [solicitudCreada, setSolicitudCreada] = useState<Solicitud | null>(null)

  const stepperCurrent = step === 'processing' ? 5 : step

  const validateStep = (current: 1 | 2 | 3 | 4): boolean => {
    const schema = wizardSchemas[current]
    const datosPorPaso = {
      1: formData.identificacion,
      2: formData.proyecto,
      3: formData.tecnica,
      4: formData.evidencia,
    }
    const resultado = schema.safeParse(datosPorPaso[current])

    if (!resultado.success) {
      setErrors(primerosErrores(resultado.error.issues))
      return false
    }
    setErrors({})
    return true
  }

  const goNext = () => {
    if (typeof step !== 'number' || step === 5) return
    if (!validateStep(step)) return
    if (step === 4) {
      setStep('processing')
      return
    }
    setStep((step + 1) as WizardStep)
  }

  const goBack = () => {
    if (typeof step === 'number' && step > 1) setStep((step - 1) as WizardStep)
  }

  const handleProcessingDone = () => {
    const nueva = crearSolicitud(formData)
    setSolicitudCreada(nueva)
    setStep(5)
    mostrarToast(`Solicitud ${nueva.id} creada correctamente.`)
  }

  const handleEditar = () => {
    setStep(1)
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {step !== 5 && (
        <div className="mb-8 text-center">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles size={13} /> Solicitud guiada
          </span>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Solicitar solución</h1>
          <p className="mt-1 text-sm text-slate-400">
            Menos campos, mejor calidad y mayor automatización.
          </p>
        </div>
      )}

      <div className="mb-8">
        <Stepper steps={STEPS} currentStep={stepperCurrent} />
      </div>

      <Card className="p-6 sm:p-8">
        {step === 1 && (
          <Step1Identificacion
            data={formData.identificacion}
            errors={errors}
            onChange={(identificacion) => setFormData({ ...formData, identificacion })}
          />
        )}
        {step === 2 && (
          <Step2Proyecto
            data={formData.proyecto}
            errors={errors}
            onChange={(proyecto) => setFormData({ ...formData, proyecto })}
          />
        )}
        {step === 3 && (
          <Step3Tecnica
            data={formData.tecnica}
            errors={errors}
            onChange={(tecnica) => setFormData({ ...formData, tecnica })}
          />
        )}
        {step === 4 && (
          <Step4Evidencia
            data={formData.evidencia}
            errors={errors}
            onChange={(evidencia) => setFormData({ ...formData, evidencia })}
          />
        )}
        {step === 'processing' && <Processing onDone={handleProcessingDone} />}
        {step === 5 && solicitudCreada && <Result solicitud={solicitudCreada} onEditar={handleEditar} />}

        {typeof step === 'number' && step !== 5 && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <Button
              variant="ghost"
              icon={<ArrowLeft size={16} />}
              onClick={goBack}
              disabled={step === 1}
            >
              Anterior
            </Button>
            <Button
              icon={step === 4 ? <Sparkles size={16} /> : <ArrowRight size={16} />}
              onClick={goNext}
            >
              {step === 4 ? 'Analizar mi solicitud' : 'Continuar'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
