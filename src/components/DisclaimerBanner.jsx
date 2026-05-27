import { AlertTriangle } from 'lucide-react'
import { DISCLAIMER_TEXT } from '../constants'

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-start max-w-7xl mx-auto">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="ml-3 text-sm text-amber-800 leading-tight">
          <strong className="font-semibold text-amber-900 mr-1">Medical Disclaimer:</strong>
          {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  )
}
