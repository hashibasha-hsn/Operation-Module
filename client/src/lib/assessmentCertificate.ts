import jsPDF from 'jspdf';
import type { AssessmentCertificateSettings } from './assessmentDraft';

type CertificatePayload = {
  userName: string;
  assessmentTitle: string;
  percentage: number;
  completedAt: Date;
  settings?: AssessmentCertificateSettings;
};

function parseValidityExpiry(
  completedAt: Date,
  settings?: AssessmentCertificateSettings,
): string | null {
  if (!settings || settings.validityType === 'none') return null;
  if (settings.validityType === 'fixed' && settings.fixedExpiryDate) {
    return new Date(settings.fixedExpiryDate).toLocaleDateString();
  }

  const duration = settings.validityDuration ?? '1 year';
  const expiry = new Date(completedAt);
  if (duration.includes('month')) {
    const months = parseInt(duration, 10) || 1;
    expiry.setMonth(expiry.getMonth() + months);
  } else if (duration.includes('year')) {
    const years = parseInt(duration, 10) || 1;
    expiry.setFullYear(expiry.getFullYear() + years);
  }
  return expiry.toLocaleDateString();
}

export function downloadAssessmentCertificate(payload: CertificatePayload) {
  const settings = payload.settings ?? {};
  const primaryColor = settings.primaryColor ?? '#0284c7';
  const headerText = settings.certificateHeader?.enabled !== false
    ? settings.certificateHeader?.text || 'Certificate of Achievement'
    : '';
  const assessmentName =
    settings.assessmentName?.enabled !== false
      ? settings.assessmentName?.text || payload.assessmentTitle
      : payload.assessmentTitle;
  const trainerName =
    settings.trainerName?.enabled && settings.trainerName?.text
      ? settings.trainerName.text
      : null;
  const showIssuedDate = settings.issuedDate?.enabled !== false;
  const expiryLabel = parseValidityExpiry(payload.completedAt, settings);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  doc.setDrawColor(primaryColor);
  doc.setLineWidth(3);
  doc.rect(36, 36, pageWidth - 72, pageHeight - 72);

  doc.setLineWidth(1);
  doc.rect(48, 48, pageWidth - 96, pageHeight - 96);

  let y = 110;
  if (headerText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(primaryColor);
    doc.text(headerText, centerX, y, { align: 'center' });
    y += 40;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor('#334155');
  doc.text('This is to certify that', centerX, y, { align: 'center' });
  y += 34;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor('#0f172a');
  doc.text(payload.userName, centerX, y, { align: 'center' });
  y += 34;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor('#334155');
  doc.text('has successfully completed', centerX, y, { align: 'center' });
  y += 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.text(assessmentName, centerX, y, { align: 'center' });
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor('#475569');
  doc.text(`Score: ${payload.percentage}%`, centerX, y, { align: 'center' });
  y += 24;

  if (trainerName) {
    doc.text(`Trainer: ${trainerName}`, centerX, y, { align: 'center' });
    y += 22;
  }

  if (showIssuedDate) {
    doc.text(`Issued: ${payload.completedAt.toLocaleDateString()}`, centerX, y, { align: 'center' });
    y += 22;
  }

  if (expiryLabel) {
    doc.text(`Valid until: ${expiryLabel}`, centerX, y, { align: 'center' });
  }

  const safeTitle = payload.assessmentTitle.replace(/[^\w\-]+/g, '_').slice(0, 40);
  doc.save(`${safeTitle}_certificate.pdf`);
}
