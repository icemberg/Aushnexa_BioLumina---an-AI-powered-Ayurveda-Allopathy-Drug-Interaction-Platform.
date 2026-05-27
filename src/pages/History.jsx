import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import { useAppStore } from '../store/appStore'
import { formatDate } from '../utils/formatters'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

export default function History() {
  const { isAuthenticated, setCurrentResults } = useAppStore()
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading, isError } = useHistory(page, limit)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleViewResult = (historyItem) => {
    // Re-hydrate the app store with this historical result
    setCurrentResults(historyItem.response)
    // The user can then go to /results to view them (not explicitly navigated here for MVP, but we'll add navigation if needed)
  }

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#03070F] text-on-surface">
        <LoadingSpinner message="Querying knowledge matrix history..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        <div className="bg-error-container/20 p-6 rounded-xl border border-error-red/30 text-error-red flex items-center gap-3">
          <span className="material-symbols-outlined text-[24px]">error</span>
          <p className="font-body-md text-body-md">Failed to load system history. Ensure the connection to the intelligence core is stable.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-10 font-body-md text-on-surface">
      {/* Background with Ken Burns animation */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none" style={{ backgroundColor: '#03070F' }}>
        <div className="absolute inset-0 bg-organic-gradient organic-bg opacity-30"></div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-surface-container-high p-3 rounded-xl border border-outline-variant/30 text-primary shadow-sm">
          <span className="material-symbols-outlined text-[24px]">history</span>
        </div>
        <h1 className="font-display-md text-display-md text-on-surface tracking-tight">Query History</h1>
      </div>

      <div className="glass-panel overflow-hidden border border-outline-variant/30">
        {data?.items?.length === 0 ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">manage_search</span>
            <p className="font-headline-sm text-headline-sm text-on-surface mb-2">No historical data found</p>
            <p className="font-body-md text-body-md text-on-surface-variant">Your interaction matrix scans will be recorded here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/80 border-b border-outline-variant/30">
                  <th className="px-6 py-5 font-technical-sm text-[12px] font-semibold text-outline uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-5 font-technical-sm text-[12px] font-semibold text-outline uppercase tracking-wider">Entities Analysed</th>
                  <th className="px-6 py-5 font-technical-sm text-[12px] font-semibold text-outline uppercase tracking-wider">Computed Risk</th>
                  <th className="px-6 py-5 font-technical-sm text-[12px] font-semibold text-outline uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container/50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-on-surface-variant font-medium">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {item.items.map((med, idx) => (
                          <span key={idx} className="bg-surface-container-high border border-outline-variant/30 text-on-surface font-technical-sm text-[12px] px-2.5 py-1 rounded-md">
                            {med}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <RiskBadge severity={item.overall_risk} score={item.overall_score} />
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewResult(item)}
                        className="text-primary hover:text-primary-fixed bg-primary/10 hover:bg-primary/20 border border-primary/20 px-4 py-2 rounded-lg transition-colors font-technical-sm text-[12px] uppercase tracking-wider flex items-center gap-2 ml-auto"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        View Matrix
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {data?.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-low/50">
            <span className="font-technical-sm text-[12px] text-on-surface-variant">
              Showing <span className="text-on-surface font-semibold">{(page - 1) * limit + 1}</span> to <span className="text-on-surface font-semibold">{Math.min(page * limit, data.total)}</span> of <span className="text-on-surface font-semibold">{data.total}</span> records
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === data.total_pages}
                className="p-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
