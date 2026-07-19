import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const fetchSystemStatus = async () => {
  const token = localStorage.getItem('access_token');
  const res = await fetch('/v1/admin/system-status', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
};

const fetchMetrics = async () => {
  const token = localStorage.getItem('access_token');
  const res = await fetch('/v1/admin/metrics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
};

const fetchRecentLogs = async () => {
  const token = localStorage.getItem('access_token');
  const res = await fetch('/v1/admin/access-logs?page=1&limit=5', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
};

function Sparkline({ data = [] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 30 - ((val - min) / range) * 20; // 10 to 30 range in svg
    return `${x},${y}`;
  }).join(' L');

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full overflow-visible">
      <path d={`M0,30 L${points} L100,30`} fill="none" stroke="#A78BFA" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function AdminDashboard() {
  const { data: statusData } = useQuery({ queryKey: ['adminStatus'], queryFn: fetchSystemStatus, refetchInterval: 60000 });
  const { data: metricsData } = useQuery({ queryKey: ['adminMetrics'], queryFn: fetchMetrics, refetchInterval: 60000 });
  const { data: logsData } = useQuery({ queryKey: ['adminRecentLogs'], queryFn: fetchRecentLogs, refetchInterval: 60000 });

  return (
    <div className="flex bg-[#070D1A] min-h-screen font-sans text-[#EDF2F8]">
      {/* Main Content Area (Sidebar is rendered by App.jsx, we just add margin) */}
      <main className="ml-[240px] flex-1 p-[40px] relative w-[calc(100%-240px)]">
        {/* Header */}
        <header className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#18C96A] shadow-[0_0_8px_rgba(24,201,106,0.8)] animate-pulse"></span>
              <span className="text-[#18C96A] text-[12px] font-mono tracking-[0.1em] uppercase font-semibold">SYSTEM VITALITY</span>
            </div>
            <h1 className="text-[48px] text-[#EDF2F8] font-extrabold leading-none" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Data Ingestion Status
            </h1>
          </div>
          
          <div className="bg-[#0C1526] border border-[#1C2E47] rounded-[12px] px-5 py-3 flex gap-6 items-center shrink-0">
            <div className="flex flex-col">
              <span className="text-[#637A94] text-[12px] font-medium mb-1">Uptime</span>
              <span className="text-[#E8960C] text-[16px] font-semibold">{statusData?.uptime || "..."}</span>
            </div>
            <div className="w-[1px] h-10 bg-[#1C2E47]"></div>
            <div className="flex flex-col">
              <span className="text-[#637A94] text-[12px] font-medium mb-1">Network Sync</span>
              {statusData?.network_sync_active ? (
                <div className="flex items-center gap-1.5 text-[#18C96A] text-[16px] font-semibold">
                  <span className="material-symbols-outlined text-[16px] animate-[spin_2s_linear_infinite]">sync</span> Active
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[#E74C3C] text-[16px] font-semibold">
                  <span className="material-symbols-outlined text-[16px]">sync_problem</span> Disconnected
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {/* Card 1 */}
          <div className="bg-[#0C1526] border border-[#1C2E47] rounded-[16px] p-[28px] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#637A94] mb-3">
                <span className="material-symbols-outlined text-[18px]">grid_on</span>
                <span className="text-[14px] font-medium">Active Protocols</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[40px] font-extrabold text-[#EDF2F8]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{metricsData?.active_protocols ?? "..."}</span>
                {metricsData && metricsData.protocols_change_pct !== undefined && (
                  <span className={`border text-[12px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                    metricsData.protocols_change_pct >= 0 
                      ? "bg-[#071A10] border-[#18C96A] text-[#18C96A]" 
                      : "bg-[#221A06] border-[#E8960C] text-[#E8960C]"
                  }`}>
                    {metricsData.protocols_change_pct >= 0 ? '↑' : '↓'} {Math.abs(metricsData.protocols_change_pct)}%
                  </span>
                )}
              </div>
            </div>
            <div className="mt-8 w-full h-[60px]">
              {metricsData?.protocols_history && <Sparkline data={metricsData.protocols_history} />}
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0C1526] border border-[#1C2E47] rounded-[16px] p-[28px] flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-[#637A94] mb-3 text-[14px] font-medium">Molecular Nodes Indexed</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[40px] font-extrabold text-[#EDF2F8]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{metricsData?.total_nodes_formatted ?? "..."}</span>
                <span className="text-[#637A94] text-[14px] font-medium">entities</span>
              </div>
            </div>
            <div className="mt-8 w-full h-[60px] relative z-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.2)_1px,_transparent_1px)] bg-[length:10px_10px] opacity-30 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C1526] to-transparent"></div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0C1526] border border-[#1C2E47] rounded-[16px] p-[28px] flex flex-col justify-between">
            <div>
              <div className="text-[#637A94] mb-3 text-[14px] font-medium">AI Calibration Confidence</div>
              <div className="flex items-center gap-4">
                <span className="text-[40px] font-extrabold text-[#EDF2F8]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{metricsData?.ai_calibration_confidence ?? "..."}%</span>
                <span className="bg-[#071A10] border border-[#18C96A] text-[#18C96A] text-[12px] font-semibold px-2 py-1 rounded-full">
                  Optimal
                </span>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex justify-between text-[#637A94] text-[12px] font-medium mb-2">
                <span>Baseline: 95%</span>
                <span>Target: 99.9%</span>
              </div>
              <div className="w-full h-2 bg-[#070D1A] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#0ecfb8] to-[#3b82f6] rounded-full" 
                  style={{ width: `${metricsData?.ai_calibration_confidence ?? 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="w-full mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[20px] font-semibold text-[#EDF2F8]" style={{ fontFamily: '"Inter", sans-serif' }}>Recent Institutional Access</h2>
            <Link to="/admin/logs" className="text-[#0ecfb8] text-[14px] font-medium hover:text-[#2dd4bf] transition-colors">
              View Full Logs →
            </Link>
          </div>
          
          <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="text-left text-[#637A94] text-[12px] uppercase tracking-wider font-medium pb-4 border-b border-[#111E33] px-4">Institution Node</th>
                <th className="text-left text-[#637A94] text-[12px] uppercase tracking-wider font-medium pb-4 border-b border-[#111E33] px-4">Access Timestamp</th>
                <th className="text-left text-[#637A94] text-[12px] uppercase tracking-wider font-medium pb-4 border-b border-[#111E33] px-4">Query Protocol</th>
                <th className="text-left text-[#637A94] text-[12px] uppercase tracking-wider font-medium pb-4 border-b border-[#111E33] px-4">Risk Status</th>
              </tr>
            </thead>
            <tbody>
              {logsData?.data?.map((log) => (
                <tr key={log.id} className="border-b border-[#111E33] hover:bg-[#111E33] transition-colors group">
                  <td className="py-4 px-4 border-l-[3px] border-l-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#070D1A] rounded-[8px] border border-[#1C2E47] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#8DA4C0] text-[20px]">
                          {log.institution_type?.includes('Center') ? 'corporate_fare' : log.institution_type?.includes('Bio') ? 'science' : 'account_balance'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[#EDF2F8] font-medium text-[14px]">{log.institution_name}</span>
                        <span className="text-[#637A94] text-[12px]">{log.institution_type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#637A94] font-mono text-[13px] whitespace-nowrap">
                    {log.timestamp.replace('T', ' ').substring(0, 19)} UTC
                  </td>
                  <td className="py-4 px-4">
                    <div className="inline-block px-3 py-1 bg-[#0C1526] border border-[#1C2E47] rounded-full text-[#8DA4C0] text-[12px] font-medium" style={{ fontFamily: '"Inter", sans-serif' }}>
                      {log.query_protocol}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {log.risk_status === 'verified' && (
                      <div className="inline-flex items-center gap-2 bg-[#071A10] border border-[#18C96A] text-[#18C96A] px-3 py-1 rounded-full text-[12px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#18C96A]"></span> Verified
                      </div>
                    )}
                    {log.risk_status === 'unverified' && (
                      <div className="inline-flex items-center gap-2 bg-[#221A06] border border-[#E8960C] text-[#E8960C] px-3 py-1 rounded-full text-[12px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#E8960C]"></span> Unverified Node
                      </div>
                    )}
                    {log.risk_status === 'anomaly' && (
                      <div className="inline-flex items-center gap-2 bg-[#310A0A] border border-[#E74C3C] text-[#E74C3C] px-3 py-1 rounded-full text-[12px] font-semibold">
                        <span className="w-2 h-2 rounded-full bg-[#E74C3C] animate-pulse"></span> Anomaly Detected
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(!logsData || logsData.data.length === 0) && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-[#637A94]">No recent access logs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
