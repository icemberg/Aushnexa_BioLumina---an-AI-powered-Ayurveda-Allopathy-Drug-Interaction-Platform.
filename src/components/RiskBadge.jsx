import clsx from 'clsx'
import { getRiskColorClass } from '../utils/riskHelpers'

export default function RiskBadge({ severity, score, className }) {
  const baseColor = getRiskColorClass(severity)
  
  return (
    <div className={clsx(
      "inline-flex items-center px-3 py-1 rounded-full border shadow-sm font-semibold text-sm tracking-wide uppercase",
      baseColor,
      className
    )}>
      {severity}
      {score !== undefined && (
        <span className="ml-2 pl-2 border-l border-current opacity-70 font-mono text-xs">
          {score.toFixed(2)}
        </span>
      )}
    </div>
  )
}
