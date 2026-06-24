import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logo from '../assets/logo.jpg';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { 
    borderBottomWidth: 2, 
    borderBottomColor: '#0ECFB8', 
    paddingBottom: 15, 
    marginBottom: 20 
  },
  companyName: { fontSize: 24, fontWeight: 'bold', color: '#03070F', marginBottom: 5 },
  subHeader: { fontSize: 12, color: '#6b7280' },
  sectionTitle: { 
    fontSize: 16, 
    color: '#0ECFB8', 
    marginTop: 20, 
    marginBottom: 10, 
    fontWeight: 'bold', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb', 
    paddingBottom: 5 
  },
  card: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  row: { flexDirection: 'row', marginBottom: 6 },
  colTitle: { fontSize: 10, fontWeight: 'bold', color: '#374151', width: '30%' },
  colValue: { fontSize: 10, color: '#4b5563', width: '70%' },
  insightRow: { flexDirection: 'row', marginBottom: 8 },
  insightBullet: { fontSize: 10, color: '#0ECFB8', marginRight: 5 },
  insightText: { fontSize: 10, color: '#374151', lineHeight: 1.5, flex: 1 },
  trialTitle: { fontSize: 12, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  trialMeta: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  emptyText: { fontSize: 10, color: '#9ca3af', fontStyle: 'italic' },
});

export const ProtocolPDFDocument = ({ aiData, evidenceData, currentResults }) => {
  const protocol = aiData?.protocol;
  const matrix = aiData?.matrix;
  const trials = evidenceData?.trials || [];
  const papers = evidenceData?.papers || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <Image src={logo} style={{ width: 40, height: 40, marginRight: 10, borderRadius: 20 }} />
            <Text style={styles.companyName}>Aushnexa Biolumina</Text>
          </View>
          <Text style={styles.subHeader}>Integrative Protocol & Clinical Evidence Report</Text>
          <Text style={{ fontSize: 9, color: '#9ca3af', marginTop: 5 }}>
            Generated on: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* RESULTS SECTION */}
        {currentResults && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>Clinical Interaction Results</Text>
            
            <View style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827', marginRight: 10 }}>Overall Risk:</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: currentResults.overall_risk?.toLowerCase() === 'critical' ? '#E03E3E' : (currentResults.overall_risk?.toLowerCase() === 'high' ? '#F06A25' : '#E8960C') }}>
                {currentResults.overall_risk?.toUpperCase()} (Score: {currentResults.overall_score})
              </Text>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Tested Compounds:</Text>
              <Text style={{ fontSize: 10, color: '#4b5563' }}>
                {currentResults.normalized_items?.map(i => i.canonical).join(', ')}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Intelligence Summary:</Text>
              <Text style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.4 }}>
                {currentResults.explanation}
              </Text>
            </View>

            {currentResults.interactions && currentResults.interactions.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Known Interactions:</Text>
                {currentResults.interactions.map((interaction, idx) => (
                  <View key={idx} style={styles.insightRow}>
                    <Text style={styles.insightBullet}>•</Text>
                    <Text style={styles.insightText}>
                      <Text style={{ fontWeight: 'bold' }}>{interaction.severity?.toUpperCase()}: </Text>
                      {interaction.summary}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* AI SECTION */}
        {protocol && (
          <View>
            <Text style={styles.sectionTitle}>AI Integrative Protocol</Text>
            
            <View style={{ marginBottom: 15 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                {protocol.title || 'Integrative Protocol'}
              </Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>
                Focus: {protocol.focus}
              </Text>
            </View>

            {protocol.allopathic_base && (
              <View style={styles.card}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                  Allopathic Base: {protocol.allopathic_base.name}
                </Text>
                <Text style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.4 }}>
                  {protocol.allopathic_base.role}
                </Text>
              </View>
            )}

            {protocol.ayurvedic_integration && (
              <View style={styles.card}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                  Ayurvedic Integration: {protocol.ayurvedic_integration.name}
                </Text>
                <Text style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.4 }}>
                  {protocol.ayurvedic_integration.role}
                </Text>
              </View>
            )}

            {protocol.insights && protocol.insights.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
                  AI Insights & Precautions
                </Text>
                {protocol.insights.map((insight, idx) => (
                  <View key={idx} style={styles.insightRow}>
                    <Text style={styles.insightBullet}>•</Text>
                    <Text style={styles.insightText}>
                      {insight.title}: {insight.body}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* MATRIX INTERACTIONS SECTION */}
            {matrix && matrix.edges && matrix.edges.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
                  Detected Molecular Interactions
                </Text>
                {matrix.edges.map((edge, idx) => (
                  <View key={idx} style={styles.card}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#111827', marginBottom: 2 }}>
                      {edge.from} &lt;-&gt; {edge.to}
                    </Text>
                    <Text style={{ fontSize: 10, color: edge.risk?.toLowerCase() === 'critical' ? '#E03E3E' : (edge.risk?.toLowerCase() === 'high' ? '#F06A25' : '#E8960C') }}>
                      Risk Level: {edge.risk?.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* CLINICAL TRIALS SECTION */}
        <Text style={styles.sectionTitle}>Clinical Evidence</Text>
        <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 10 }}>
          Aggregated from ClinicalTrials.gov, PubMed, CTRI, and Semantic Scholar
        </Text>

        {/* Evidence Synthesis */}
        {evidenceData?.ai_summary && (
          <View style={styles.card}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0ECFB8', marginBottom: 4 }}>Evidence Synthesis (AI Summary):</Text>
            <Text style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.4 }}>{evidenceData.ai_summary}</Text>
            
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Text style={{ fontSize: 10, color: '#6b7280', marginRight: 15 }}>
                High Relevance: {trials.filter(t => t.relevance_score >= 2).length + papers.filter(p => p.relevance_score >= 2).length}
              </Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>
                Medium Relevance: {trials.filter(t => t.relevance_score === 1).length + papers.filter(p => p.relevance_score === 1).length}
              </Text>
            </View>
          </View>
        )}

        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
            Clinical Trials ({trials.length})
          </Text>
          {trials.length === 0 ? (
            <Text style={styles.emptyText}>No clinical trials found.</Text>
          ) : (
            trials.map((trial, idx) => (
              <View key={idx} style={styles.card}>
                <Text style={styles.trialTitle}>{trial.title}</Text>
                <Text style={styles.trialMeta}>Status: {trial.status || 'Unknown'} | Phase: {trial.phase || 'N/A'}</Text>
                <Text style={styles.trialMeta}>Conditions: {trial.condition || 'N/A'}</Text>
                <Text style={styles.trialMeta}>Source: {trial.source_registry}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
            Published Research ({papers.length})
          </Text>
          {papers.length === 0 ? (
            <Text style={styles.emptyText}>No published papers found.</Text>
          ) : (
            papers.map((paper, idx) => (
              <View key={idx} style={styles.card}>
                <Text style={styles.trialTitle}>{paper.title}</Text>
                <Text style={styles.trialMeta}>Authors: {paper.authors}</Text>
                <Text style={styles.trialMeta}>Journal: {paper.journal} | Year: {paper.year}</Text>
                <Text style={styles.trialMeta}>Source: {paper.source_registry}</Text>
              </View>
            ))
          )}
        </View>

      </Page>
    </Document>
  );
};
