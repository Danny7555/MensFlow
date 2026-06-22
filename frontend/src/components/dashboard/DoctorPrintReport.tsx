import { format } from 'date-fns'
import { SYMPTOM_DEFS, type SymptomDef } from '../../data/symptomsData'

import type { AppUser } from '../../store/types'

interface Log {
  date: string
  symptoms: string[]
  water?: number
  weight?: number
}

interface Med {
  _id: string
  name: string
  dosage?: string
  frequency: string
  timeOfDay: string
  notes?: string
  active: boolean
}

interface Dashboard {
  typicalCycleDays: number
  lastPeriodStart: string
  periodLength?: number
  cycleVariationDays?: number
  isAtypical?: boolean
}

export function DoctorPrintReport({
  user,
  dashboard,
  logs,
  customSymptoms,
  activeMeds,
}: {
  user: AppUser
  dashboard: Dashboard
  logs: Log[]
  customSymptoms: SymptomDef[]
  activeMeds: Med[]
}) {
  const printDate = format(new Date(), 'MMMM d, yyyy')

  return (
    <div className="print-only print-report-container">
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, header, nav, aside, .sidebar-container, .header-container, button, .chat-layout-container, .btn, footer {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-report-container {
            width: 100%;
            margin: 0;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
            background: white;
            color: black;
          }
          .print-header {
            border-bottom: 2px solid #ff6b8b;
            padding-bottom: 15px;
            margin-bottom: 30px;
          }
          .print-title {
            font-size: 28px;
            color: #ff6b8b;
            margin: 0;
            font-weight: 700;
          }
          .print-meta {
            font-size: 12px;
            color: #555;
            margin-top: 5px;
          }
          .print-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .print-section-title {
            font-size: 18px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 12px;
            color: #111;
            font-weight: 600;
          }
          .print-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          .print-card {
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 12px;
            background: #fafafa;
          }
          .print-card-label {
            font-size: 11px;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .print-card-value {
            font-size: 16px;
            font-weight: 600;
            color: #111;
            margin-top: 4px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .print-table th, .print-table td {
            border: 1px solid #ccc;
            padding: 8px 12px;
            text-align: left;
            font-size: 12px;
          }
          .print-table th {
            background: #f0f0f0;
            font-weight: 600;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
      <div className="print-header">
        <h1 className="print-title">MensFlow — Cycle Health Report</h1>
        <p className="print-meta">Generated on {printDate} for {user?.name || 'User'}</p>
      </div>

      <div className="print-section">
        <h2 className="print-section-title">1. Patient Cycle Overview</h2>
        <div className="print-grid">
          <div className="print-card">
            <div className="print-card-label">Typical Cycle Length</div>
            <div className="print-card-value">{dashboard?.typicalCycleDays || 28} days</div>
          </div>
          <div className="print-card">
            <div className="print-card-label">Last Period Start</div>
            <div className="print-card-value">
              {dashboard?.lastPeriodStart
                ? format(new Date(dashboard.lastPeriodStart + 'T12:00:00'), 'MMMM d, yyyy')
                : 'Not set'}
            </div>
          </div>
          <div className="print-card">
            <div className="print-card-label">Cycle Regularity</div>
            <div className="print-card-value">
              {dashboard?.isAtypical ? 'Irregular / Atypical' : 'Regular / Typical'}
            </div>
          </div>
          <div className="print-card">
            <div className="print-card-label">Cycle Variation</div>
            <div className="print-card-value">± {dashboard?.cycleVariationDays || 2} days</div>
          </div>
        </div>
      </div>

      {activeMeds.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">2. Active Medications &amp; Supplements</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Medication Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Scheduled Time</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {activeMeds.map((med) => (
                <tr key={med._id}>
                  <td style={{ fontWeight: 600 }}>{med.name}</td>
                  <td>{med.dosage || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{med.frequency}</td>
                  <td>{med.timeOfDay}</td>
                  <td>{med.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="print-section">
        <h2 className="print-section-title">3. Symptom History (Last 30 Days)</h2>
        {logs && logs.length > 0 ? (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Date</th>
                <th>Logged Symptoms / Metrics</th>
              </tr>
            </thead>
            <tbody>
              {logs
                .toSorted((a, b) => b.date.localeCompare(a.date))
                .slice(0, 30)
                .map((log) => {
                  const allSymptomDefs = [...SYMPTOM_DEFS, ...customSymptoms]
                  const symptomLabels = log.symptoms
                    .map((sId) => allSymptomDefs.find((s) => s.id === sId)?.label || sId)
                    .join(', ')

                  const metrics = [
                    symptomLabels ? `Symptoms: ${symptomLabels}` : null,
                    log.water ? `Water: ${log.water} ml` : null,
                    log.weight ? `Weight: ${log.weight} kg` : null,
                  ].filter(Boolean).join(' | ')

                  return (
                    <tr key={log.date}>
                      <td>{format(new Date(log.date + 'T12:00:00'), 'MMM d, yyyy')}</td>
                      <td>{metrics || 'No metrics logged'}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '12px', color: '#666' }}>No symptom logs recorded in this period.</p>
        )}
      </div>
    </div>
  )
}
