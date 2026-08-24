import os
import time
from typing import List, Optional, Dict, Any
from loguru import logger

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.enums import TA_LEFT

from app.core.config import settings
from app.schemas.analysis import AnalysisResponse

class ReportService:
    """
    Generates a downloadable PDF report of the SatQuery AI analysis.
    Ensures only observable execution data and final answers are included.
    """
    
    def __init__(self):
        self.report_dir = os.path.join(settings.STORAGE_DIR, "reports")
        os.makedirs(self.report_dir, exist_ok=True)
        logger.info(f"ReportService initialized. Output dir: {self.report_dir}")

    def generate_pdf(self, response: AnalysisResponse, input_metadata: List[Dict[str, Any]] = None) -> str:
        """
        Generates a PDF report from the AnalysisResponse.
        
        Args:
            response: The final AnalysisResponse object from the controller.
            input_metadata: Optional list of dictionaries containing input image metadata.
            
        Returns:
            The local file path to the generated PDF.
        """
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"satquery_report_{timestamp}.pdf"
        filepath = os.path.join(self.report_dir, filename)
        
        doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=0.5*inch, leftMargin=0.5*inch, topMargin=0.5*inch, bottomMargin=0.5*inch)
        
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Justified', alignment=TA_LEFT, fontSize=10, leading=14))
        
        story = []
        
        # --- Title ---
        story.append(Paragraph("SatQuery AI - Analysis Report", styles['Title']))
        story.append(Spacer(1, 0.25 * inch))
        
        # --- Metadata ---
        story.append(Paragraph(f"<b>Timestamp:</b> {time.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Paragraph(f"<b>Task Selected:</b> {response.task_type.value}", styles['Normal']))
        story.append(Spacer(1, 0.15 * inch))
        
        # --- Query ---
        story.append(Paragraph("<b>User Query:</b>", styles['Heading2']))
        story.append(Paragraph(response.query, styles['Justified']))
        story.append(Spacer(1, 0.15 * inch))
        
        # --- Input Information ---
        if input_metadata:
            story.append(Paragraph("<b>Input Information:</b>", styles['Heading2']))
            for img_meta in input_metadata:
                story.append(Paragraph(f"File: {img_meta.get('filename', 'N/A')} | Size: {img_meta.get('size_mb', 0):.2f}MB | Modality: {img_meta.get('modality', 'UNKNOWN')}", styles['Normal']))
            story.append(Spacer(1, 0.15 * inch))
            
        # --- Models Used ---
        story.append(Paragraph("<b>Models Used:</b>", styles['Heading2']))
        if response.model_info:
            for model in response.model_info:
                story.append(Paragraph(f"- {model.model_name} ({model.device})", styles['Normal']))
        else:
            # Extract from trace if model_info is empty
            models_used = set()
            for step in response.execution_trace.steps:
                if step.model_execution:
                    models_used.add(step.model_execution.model_name)
            for m in models_used:
                story.append(Paragraph(f"- {m}", styles['Normal']))
        story.append(Spacer(1, 0.15 * inch))
        
        # --- Answer & Confidence ---
        story.append(Paragraph("<b>Final Answer:</b>", styles['Heading2']))
        story.append(Paragraph(response.answer, styles['Justified']))
        story.append(Spacer(1, 0.1 * inch))
        story.append(Paragraph(f"<b>Confidence:</b> {response.confidence.score:.2%} ({response.confidence.level.value})", styles['Normal']))
        story.append(Paragraph(f"<i>Rationale:</i> {response.confidence.rationale}", styles['Italic']))
        story.append(Spacer(1, 0.15 * inch))
        
        # --- Warnings & Fallback ---
        if response.warnings:
            story.append(Paragraph("<b>Warnings & Fallback Information:</b>", styles['Heading2']))
            for w in response.warnings:
                story.append(Paragraph(f"⚠️ {w}", styles['Normal']))
            story.append(Spacer(1, 0.15 * inch))
            
        # --- Visual Evidence ---
        if response.visual_artifacts:
            story.append(Paragraph("<b>Visual Evidence:</b>", styles['Heading2']))
            # Map URLs to local file paths
            for url in response.visual_artifacts:
                local_path = url.replace("/storage", settings.STORAGE_DIR)
                if os.path.exists(local_path):
                    try:
                        img = RLImage(local_path, width=6*inch, height=4*inch)
                        img._restrictSize(6*inch, 4*inch)
                        story.append(img)
                        story.append(Spacer(1, 0.1 * inch))
                    except Exception as e:
                        story.append(Paragraph(f"Could not embed image {url}: {e}", styles['Normal']))
                else:
                    story.append(Paragraph(f"Artifact not found: {url}", styles['Normal']))
            story.append(Spacer(1, 0.15 * inch))
            
        # --- Execution Trace ---
        story.append(Paragraph("<b>Auditable Execution Trace:</b>", styles['Heading2']))
        
        trace_data = [["Step", "Status", "Message", "Model/Tool"]]
        for step in response.execution_trace.steps:
            model_name = step.model_execution.model_name if step.model_execution else "N/A"
            trace_data.append([
                str(step.step_id),
                step.status.upper(),
                Paragraph(step.message, styles['Justified']),
                model_name
            ])
            
        # Only draw table if we have steps
        if len(trace_data) > 1:
            trace_table = Table(trace_data, colWidths=[0.5*inch, 0.8*inch, 3.5*inch, 1.7*inch])
            trace_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(trace_table)
        else:
            story.append(Paragraph("No trace steps recorded.", styles['Normal']))
            
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph(f"<i>Total Execution Time: {response.execution_trace.total_duration_ms:.2f} ms</i>", styles['Italic']))
        
        # Build PDF
        try:
            doc.build(story)
            logger.success(f"PDF Report generated successfully at {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {e}")
            raise

# Singleton instance
report_service = ReportService()