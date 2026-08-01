import jsPDF from 'jspdf';
import type { AssessmentCertificateSettings } from './assessmentDraft';

type CourseCertificatePayload = {
  userName: string;
  courseTitle: string;
  score: number;
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

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function darken(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  const num = parseInt(value, 16);
  const r = Math.max(0, (num >> 16) & 255) + amount;
  const g = Math.max(0, (num >> 8) & 255) + amount;
  const b = Math.max(0, num & 255) + amount;
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export async function downloadCourseCertificate(payload: CourseCertificatePayload) {
  const settings = payload.settings ?? {};
  const primaryColor = settings.primaryColor ?? '#0284c7';
  const secondaryColor = settings.secondaryColor ?? '#0f766e';
  const backgroundColor = settings.backgroundColor ?? '#ffffff';
  const borderStyle = settings.borderStyle ?? 'classic';
  const headerText = settings.certificateHeader?.enabled !== false
    ? settings.certificateHeader?.text || 'Certificate of Achievement'
    : null;
  const recipientLabel = settings.recipientLabel?.enabled !== false
    ? settings.recipientLabel?.text || 'This is to certify that'
    : null;
  const bodyText = settings.bodyText?.enabled !== false
    ? settings.bodyText?.text || 'has successfully completed'
    : null;
  const courseName =
    settings.assessmentName?.enabled !== false
      ? settings.assessmentName?.text || payload.courseTitle
      : payload.courseTitle;
  const trainerName =
    settings.trainerName?.enabled && settings.trainerName?.text
      ? settings.trainerName.text
      : null;
  const showScore = settings.score?.enabled !== false;
  const showIssuedDate = settings.issuedDate?.enabled !== false;
  const signature = settings.signature?.enabled
    ? { name: settings.signature?.name || '', title: settings.signature?.title || 'Course Instructor' }
    : null;
  const expiryLabel = parseValidityExpiry(payload.completedAt, settings);

  // Resolve logo to a data URL (jspdf can only embed data URLs or local images)
  let logoDataUrl: string | null = null;
  if (settings.showLogo && settings.logoUrl) {
    logoDataUrl = await fetchImageAsDataUrl(settings.logoUrl);
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // Background
  doc.setFillColor(backgroundColor);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative background band (modern)
  if (borderStyle === 'modern') {
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.rect(0, pageHeight - 26, pageWidth, 26, 'F');
    doc.setFillColor(secondaryColor);
    doc.rect(0, 0, pageWidth, 8, 'F');
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  } else if (borderStyle === 'minimal') {
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(4);
    doc.rect(40, 40, pageWidth - 80, pageHeight - 80);
  }

  // Classic double border + corner accents
  if (borderStyle === 'classic') {
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(3);
    doc.rect(36, 36, pageWidth - 72, pageHeight - 72);
    doc.setLineWidth(1);
    doc.rect(48, 48, pageWidth - 96, pageHeight - 96);

    // Corner ornaments
    const c = 20;
    doc.setDrawColor(secondaryColor);
    doc.setLineWidth(2);
    const corners = [
      [48, 48, 1, 1],
      [pageWidth - 48, 48, -1, 1],
      [48, pageHeight - 48, 1, -1],
      [pageWidth - 48, pageHeight - 48, -1, -1],
    ];
    for (const [x, y, dx, dy] of corners) {
      doc.line(x, y, x + c * dx, y);
      doc.line(x, y, x, y + c * dy);
    }
  }

  let y = 100;

  // Logo
  if (logoDataUrl && settings.showLogo) {
    try {
      doc.addImage(logoDataUrl, 'PNG', centerX - 32, y - 40, 64, 64);
      y += 55;
    } catch {
      // PNG-based logos may fail if JPEG; retry as JPEG
      try {
        doc.addImage(logoDataUrl, 'JPEG', centerX - 32, y - 40, 64, 64);
        y += 55;
      } catch {
        // ignore broken logo
      }
    }
  }

  if (headerText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.setTextColor(primaryColor);
    doc.text(headerText, centerX, y, { align: 'center' });
    y += 16;
    doc.setDrawColor(secondaryColor);
    doc.setLineWidth(1.5);
    doc.line(centerX - 120, y, centerX + 120, y);
    y += 40;
  }

  if (recipientLabel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor('#475569');
    doc.text(recipientLabel, centerX, y, { align: 'center' });
    y += 36;
  }

  // Recipient name
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(34);
  doc.setTextColor('#0f172a');
  doc.text(payload.userName, centerX, y, { align: 'center' });
  y += 14;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.line(centerX - 150, y, centerX + 150, y);
  y += 34;

  if (bodyText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor('#475569');
    doc.text(bodyText, centerX, y, { align: 'center' });
    y += 32;
  }

  // Course name
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(secondaryColor);
  doc.text(courseName, centerX, y, { align: 'center' });
  y += 32;

  if (showScore) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor('#475569');
    doc.text(`Score: ${payload.score}%`, centerX, y, { align: 'center' });
    y += 24;
  }

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
    y += 26;
  }

  // Signature block
  if (signature) {
    const sigX = centerX;
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(1.2);
    doc.line(sigX - 100, y, sigX + 100, y);
    if (signature.name) {
      doc.setFont('times', 'italic');
      doc.setFontSize(14);
      doc.setTextColor('#0f172a');
      doc.text(signature.name, sigX, y + 16, { align: 'center' });
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(darken(primaryColor, 20));
    doc.text(signature.title, sigX, y + 30, { align: 'center' });
  }

  const safeTitle = payload.courseTitle.replace(/[^\w\-]+/g, '_').slice(0, 40);
  doc.save(`${safeTitle}_certificate.pdf`);
}
