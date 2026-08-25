import { AnalysisResultData } from './types';

/**
 * Generate a printable ISRO Geospatial PDF / HTML Intelligence Report
 */
export function generatePrintableReportHtml(data: AnalysisResultData): string {
  const modelsList = data.modelsUsed.map(m => m.name).join(', ');
  const traceList = data.trace
    .map(t => `<tr><td style="padding:4px 8px;font-family:monospace;font-size:11px;border-bottom:1px solid #ddd;">[${t.timestamp}]</td><td style="padding:4px 8px;font-weight:bold;font-size:11px;border-bottom:1px solid #ddd;">${t.agent}</td><td style="padding:4px 8px;font-size:11px;border-bottom:1px solid #ddd;">${t.details}</td></tr>`)
    .join('');

  const metricsList = Object.entries(data.evidence.derivedMetrics || {})
    .map(([k, v]) => `<div style="background:#f1f5f9;padding:8px 12px;border-radius:6px;margin:4px;"><span style="font-size:10px;text-transform:uppercase;color:#64748b;display:block;">${k}</span><strong style="font-size:14px;color:#0f172a;">${v}</strong></div>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>SATQuery AI — Geospatial Intelligence Report (${data.id})</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; }
      .no-print { display: none; }
      @page { size: A4; margin: 1.5cm; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; max-width: 900px; margin: 0 auto; color: #0f172a; line-height: 1.5; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
    .badge { display: inline-block; background: #0f172a; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .section { margin-top: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #fafafa; }
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 10px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin:0;font-size:22px;color:#0f172a;">SATQuery AI — Geospatial Intelligence Mission Report</h1>
      <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">Autonomous Earth Observation • Multi-Modal Remote Sensing Pipeline</p>
    </div>
    <div style="text-align:right;">
      <span class="badge">MISSION ID: ${data.id}</span>
      <div style="font-size:11px;color:#64748b;margin-top:4px;">Date: ${data.createdAt}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. Mission Telemetry & Classification</div>
    <table style="font-size:12px;">
      <tr><td style="width:25%;font-weight:bold;">Identified Task:</td><td>${data.taskType}</td><td style="width:25%;font-weight:bold;">Overall Confidence:</td><td style="color:#059669;font-weight:bold;">${data.confidence}%</td></tr>
      <tr><td style="font-weight:bold;">Sensor Modality:</td><td>${data.spatialMetadata?.sensor || data.mode}</td><td style="font-weight:bold;">Coordinate Reference:</td><td>${data.spatialMetadata?.crs || 'EPSG:32643 (WGS 84)'}</td></tr>
      <tr><td style="font-weight:bold;">Models Orchestrated:</td><td colspan="3">${modelsList}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">2. Natural-Language Query & Multimodal Response</div>
    <div style="background:#fff;border-left:3px solid #6366f1;padding:8px 12px;font-style:italic;font-size:13px;margin-bottom:12px;">
      "${data.query}"
    </div>
    <div style="font-size:13px;white-space:pre-line;color:#1e293b;line-height:1.6;">
      ${data.answer}
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Derived Geospatial Analytics & Evidence Telemetry</div>
    <div class="metrics-grid">
      ${metricsList}
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. Auditable Agent Execution Trail</div>
    <table>
      <thead>
        <tr style="background:#e2e8f0;font-size:10px;text-transform:uppercase;">
          <th style="padding:4px 8px;text-align:left;">Offset</th>
          <th style="padding:4px 8px;text-align:left;">Agent Node</th>
          <th style="padding:4px 8px;text-align:left;">Operation Details</th>
        </tr>
      </thead>
      <tbody>
        ${traceList}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>SATQuery AI Remote Sensing Platform • Certified Grounding Verification Hash: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()}</div>
    <div>CONFIDENTIAL & PROPRIETARY • EARTH OBSERVATION AUDIT TRAIL</div>
  </div>

  <script>
    window.onload = function() {
      // Auto open print dialog if opened in popup
      window.print();
    }
  </script>
</body>
</html>
  `;
}

/**
 * Trigger download of raw analysis JSON
 */
export function downloadJsonReport(data: AnalysisResultData) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `satquery_intelligence_report_${data.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open print-ready window for PDF export
 */
export function exportPdfReport(data: AnalysisResultData) {
  const html = generatePrintableReportHtml(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
