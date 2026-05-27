import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const fetchLogs = async ({ page, status }) => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`http://localhost:8000/v1/admin/access-logs?page=${page}&limit=10${status && status !== 'All' ? `&status=${status}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
};

const verifyInstitution = async (logId) => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`http://localhost:8000/v1/admin/access-logs/${logId}/verify`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to verify');
  return res.json();
};

export default function AdminLogs() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminLogs', page, statusFilter],
    queryFn: () => fetchLogs({ page, status: statusFilter }),
    keepPreviousData: true
  });

  const verifyMutation = useMutation({
    mutationFn: verifyInstitution,
    onSuccess: () => {
      toast.success('Institution verified successfully');
      queryClient.invalidateQueries({ queryKey: ['adminLogs'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentLogs'] });
    },
    onError: () => {
      toast.error('Failed to verify institution');
    }
  });

  const handleExport = () => {
    const token = localStorage.getItem('access_token');
    fetch('http://localhost:8000/v1/admin/access-logs/export', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `access_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  };

  const statuses = ['All', 'Verified', 'Unverified', 'Anomaly'];

  return (
    <div className="flex bg-[#070D1A] min-h-screen font-sans text-[#EDF2F8]">
      <main className="ml-[240px] flex-1 p-[40px] relative w-[calc(100%-240px)]">
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#0ecfb8] text-[12px] font-mono tracking-[0.1em] uppercase font-semibold">ACCESS MONITOR</span>
            </div>
            <h1 className="text-[36px] text-[#EDF2F8] font-extrabold leading-none" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Institutional Access Logs
            </h1>
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#1C2E47] hover:bg-[#2A4365] text-[#EDF2F8] px-4 py-2 rounded-lg transition-colors font-medium text-[14px]"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
        </header>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${
                statusFilter === s 
                  ? 'bg-[#1C2E47] border-[#2A4365] text-white' 
                  : 'bg-transparent border-[#1C2E47] text-[#637A94] hover:text-[#EDF2F8]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#0C1526] border border-[#1C2E47] rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#111E33] border-b border-[#1C2E47]">
                <th className="py-3 px-4 text-[#637A94] text-[12px] uppercase font-medium">Institution Node</th>
                <th className="py-3 px-4 text-[#637A94] text-[12px] uppercase font-medium">Timestamp</th>
                <th className="py-3 px-4 text-[#637A94] text-[12px] uppercase font-medium">Protocol</th>
                <th className="py-3 px-4 text-[#637A94] text-[12px] uppercase font-medium">Risk Status</th>
                <th className="py-3 px-4 text-[#637A94] text-[12px] uppercase font-medium w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8 text-[#637A94]">Loading logs...</td></tr>
              ) : data?.data?.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="border-b border-[#1C2E47] hover:bg-[#111E33]/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-[#EDF2F8] font-medium text-[14px]">{log.institution_name}</span>
                        <span className="text-[#637A94] text-[12px]">{log.institution_type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#637A94] font-mono text-[13px]">
                      {log.timestamp.replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-4 px-4 text-[#8DA4C0] text-[13px]">
                      {log.query_protocol}
                    </td>
                    <td className="py-4 px-4">
                      {log.risk_status === 'verified' && (
                        <span className="inline-flex items-center gap-1.5 text-[#18C96A] text-[12px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#18C96A]"></span> Verified
                        </span>
                      )}
                      {log.risk_status === 'unverified' && (
                        <span className="inline-flex items-center gap-1.5 text-[#E8960C] text-[12px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E8960C]"></span> Unverified Node
                        </span>
                      )}
                      {log.risk_status === 'anomaly' && (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 text-[#E74C3C] text-[12px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C]"></span> Anomaly Detected
                          </span>
                          <span className="text-[#637A94] text-[11px] mt-1 line-clamp-1">{log.anomaly_reason}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button 
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                        className="p-1 rounded hover:bg-[#1C2E47] text-[#637A94] hover:text-white transition-colors mr-2"
                        title="View Details"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {expandedRow === log.id ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>
                      
                      {log.risk_status === 'unverified' && (
                        <button 
                          onClick={() => verifyMutation.mutate(log.id)}
                          disabled={verifyMutation.isLoading}
                          className="p-1 rounded hover:bg-[#071A10] text-[#18C96A] transition-colors"
                          title="Verify Institution"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        </button>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded Row Details */}
                  {expandedRow === log.id && (
                    <tr className="bg-[#070D1A] border-b border-[#1C2E47]">
                      <td colSpan="5" className="p-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-[12px] uppercase text-[#637A94] font-semibold mb-2">Request JSON</h4>
                            <pre className="bg-[#0C1526] p-3 rounded text-[12px] text-[#A78BFA] font-mono overflow-auto max-h-[200px]">
                              {JSON.stringify(log.request_json, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-[12px] uppercase text-[#637A94] font-semibold mb-2">Details</h4>
                            <div className="flex flex-col gap-2 text-[13px]">
                              <div className="flex justify-between border-b border-[#1C2E47] pb-2">
                                <span className="text-[#637A94]">Result Summary</span>
                                <span className="text-[#EDF2F8]">{log.response_summary || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between border-b border-[#1C2E47] pb-2">
                                <span className="text-[#637A94]">Log ID</span>
                                <span className="text-[#EDF2F8] font-mono text-[11px]">{log.id}</span>
                              </div>
                              {log.anomaly_reason && (
                                <div className="flex flex-col mt-2">
                                  <span className="text-[#E74C3C] font-semibold">Anomaly Trigger:</span>
                                  <span className="text-[#EDF2F8]">{log.anomaly_reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {data?.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1C2E47]">
              <span className="text-[#637A94] text-[13px]">
                Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.total)} of {data.total} entries
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-[#1C2E47] text-white disabled:opacity-50 text-[13px]"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                  className="px-3 py-1 rounded bg-[#1C2E47] text-white disabled:opacity-50 text-[13px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
