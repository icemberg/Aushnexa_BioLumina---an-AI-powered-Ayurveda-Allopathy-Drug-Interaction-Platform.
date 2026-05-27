import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { LOADING_STEPS } from '../constants'

export default function LoadingSpinner({ message = "Analyzing interactions..." }) {
  const [currentStep, setCurrentStep] = useState(0)

  // Cycle through loading steps to provide user feedback during long requests
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev))
    }, 1500)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
        <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-xl animate-pulse"></div>
      </div>
      
      <h3 className="mt-6 text-lg font-semibold text-gray-900">{message}</h3>
      
      <div className="mt-4 flex flex-col items-center space-y-2 w-full max-w-xs">
        {LOADING_STEPS.map((step, index) => (
          <div 
            key={index}
            className={`flex items-center text-sm transition-all duration-300 w-full ${
              index === currentStep 
                ? 'text-brand-primary font-medium scale-105' 
                : index < currentStep 
                  ? 'text-green-600' 
                  : 'text-gray-300'
            }`}
          >
            {index < currentStep ? (
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : index === currentStep ? (
              <span className="w-2 h-2 rounded-full bg-brand-primary mr-3 ml-1 animate-pulse flex-shrink-0" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-gray-200 mr-3.5 ml-1.5 flex-shrink-0" />
            )}
            <span className="truncate">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
