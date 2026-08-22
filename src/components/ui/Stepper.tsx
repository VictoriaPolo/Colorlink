import { Check } from 'lucide-react'

export interface StepperStep {
  label: string
}

export default function Stepper({
  steps,
  currentStep,
}: {
  steps: StepperStep[]
  currentStep: number
}) {
  return (
    <ol className="flex w-full items-start justify-between gap-1 sm:gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isDone = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <li key={step.label} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className="flex-1">
                {index !== 0 && (
                  <div className={`h-0.5 w-full ${isDone || isCurrent ? 'bg-primary' : 'bg-slate-200'}`} />
                )}
              </div>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 sm:h-9 sm:w-9 ${
                  isDone
                    ? 'bg-primary text-white'
                    : isCurrent
                      ? 'bg-navy text-white ring-4 ring-pink-100'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <Check size={16} /> : stepNumber}
              </div>
              <div className="flex-1">
                {index !== steps.length - 1 && (
                  <div className={`h-0.5 w-full ${isDone ? 'bg-primary' : 'bg-slate-200'}`} />
                )}
              </div>
            </div>
            <span
              className={`mt-2 hidden text-xs font-medium sm:block ${
                isCurrent ? 'text-navy' : isDone ? 'text-primary' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
