import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getKnowledgeNode } from '../services/api';

export default function CompoundReport() {
  const params = useParams();
  const compoundId = decodeURIComponent(params['*'] || '');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getKnowledgeNode(compoundId)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [compoundId]);

  if (loading) {
    return (
      <main className="flex-1 matrix-bg w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex-1 matrix-bg w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl text-error mb-4">Report Not Found</h1>
        <button onClick={() => navigate(-1)} className="px-4 py-2 border border-primary text-primary rounded-lg">
          Go Back
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 relative matrix-bg w-full h-[calc(100vh-80px)] overflow-y-auto p-8">
      <div className="max-w-container-max mx-auto space-y-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-on-surface-variant hover:text-on-surface transition-colors mb-6">
          <span className="material-symbols-outlined mr-2">arrow_back</span>
          Back to Knowledge Graph
        </button>

        <div className="bg-surface-container/60 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full font-label-caps text-label-sm">
              {data.type || 'Phytochemical'}
            </span>
            {data.confidence_score && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-label-caps text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                {data.confidence_score}% Confidence
              </span>
            )}
          </div>
          
          <h1 className="font-display-md text-display-md text-primary-fixed mb-2">{data.id}</h1>
          {data.properties?.scientific_name && (
            <p className="font-headline-sm text-headline-sm text-on-surface-variant mb-6 italic">
              {data.properties.scientific_name}
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 border-b border-outline-variant/30 pb-2">
                  {data.type === 'Mechanism' || data.type === 'Interaction' ? 'Mechanism Details' : 'Description'}
                </h3>
                {data.properties?.description && (
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-4">
                    {data.properties.description}
                  </p>
                )}
                {data.properties?.mechanism && (
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-4">
                    <strong className="text-on-surface">Mechanism: </strong>
                    {data.properties.mechanism}
                  </p>
                )}
                {data.properties?.recommendation && (
                  <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl mt-4">
                    <strong className="text-primary font-label-lg block mb-1">Recommendation</strong>
                    <p className="font-body-md text-on-surface-variant">
                      {data.properties.recommendation}
                    </p>
                  </div>
                )}
                {(!data.properties?.description && !data.properties?.mechanism) && (
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed italic opacity-60">
                    No detailed description or mechanism available for this entity.
                  </p>
               )}
             </section>

              {data.interactions && data.interactions.length > 0 && (
                <section>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 border-b border-outline-variant/30 pb-2">
                    Known Interactions ({data.interactions.length})
                  </h3>
                  <div className="space-y-4 mt-4">
                    {data.interactions.map((int_, i) => {
                      const severityColor = {
                        critical: 'bg-red-500/20 text-red-400 border-red-500/30',
                        high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                        moderate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                        low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }[int_.severity] || 'bg-surface-container-high text-on-surface-variant border-outline-variant/30';
                      
                      return (
                        <div key={i} className="bg-surface-container-high/60 border border-outline-variant/20 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary">medication</span>
                              <span className="font-label-lg text-on-surface">{int_.partner}</span>
                              {int_.partner_type && (
                                <span className="text-technical-sm text-on-surface-variant px-2 py-0.5 bg-surface-container rounded-full">
                                  {int_.partner_type}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {int_.interaction_type && (
                                <span className="text-technical-sm text-on-surface-variant px-2 py-0.5 bg-surface-container rounded-full">
                                  {int_.interaction_type}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-technical-sm font-medium border ${severityColor}`}>
                                {int_.severity || 'unknown'}
                              </span>
                            </div>
                          </div>
                          
                          {int_.mechanism && (
                            <div>
                              <span className="text-technical-sm text-on-surface-variant block mb-1">Mechanism</span>
                              <p className="font-body-md text-on-surface leading-relaxed">{int_.mechanism}</p>
                            </div>
                          )}
                          
                          {int_.recommendation && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                              <span className="text-technical-sm text-primary block mb-1">Recommendation</span>
                              <p className="font-body-md text-on-surface-variant">{int_.recommendation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-surface-container-high border border-outline-variant/30 rounded-xl p-6">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4">Metadata</h3>
                <dl className="space-y-3">
                  {Object.entries(data.properties || {}).map(([k, v]) => {
                    if (['name', 'scientific_name', 'description', 'mechanism', 'recommendation'].includes(k)) return null;
                    if (k.endsWith('_en')) return null;
                    const displayValue = Array.isArray(v) ? v.join(', ') : String(v);
                    return (
                      <div key={k}>
                        <dt className="text-technical-sm text-on-surface-variant capitalize">{k.replace(/_/g, ' ')}</dt>
                        <dd className="text-body-md text-on-surface truncate">{displayValue}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
