import PDFDocument from 'pdfkit';

export type ReportQuestion = {
  questionText: string;
  questionType?: string;
  answer?: unknown;
};

export type ReportSection = {
  title: string;
  questions: ReportQuestion[];
};

export type SubmissionReport = {
  processTitle: string;
  workflowType?: string;
  submittedBy?: string;
  storeName?: string;
  submittedAt?: string;
  status?: string;
  sections: ReportSection[];
};

function formatAnswer(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function generateReportPdf(report: SubmissionReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .rect(0, 0, doc.page.width, 88)
      .fill('#1e293b');
    doc
      .fill('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(report.processTitle || 'Submission Report', 48, 32);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fill('#94a3b8')
      .text(
        report.workflowType ? report.workflowType.charAt(0).toUpperCase() + report.workflowType.slice(1) : 'Submission',
        48,
        58,
      );

    let y = 120;

    // Meta block
    const metaRows: Array<[string, string]> = [
      ['Submitted by', report.submittedBy || '—'],
      ['Store', report.storeName || '—'],
      ['Submitted at', report.submittedAt || '—'],
      ['Status', report.status || '—'],
    ];
    for (const [label, value] of metaRows) {
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fill('#64748b')
        .text(label, 48, y);
      const labelWidth = doc.widthOfString(label) + 8;
      doc
        .font('Helvetica')
        .fill('#1e293b')
        .text(value, 48 + labelWidth, y);
      y += 18;
    }

    y += 12;

    // Sections
    for (const section of report.sections || []) {
      if (y > doc.page.height - 96) {
        doc.addPage();
        y = 48;
      }
      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fill('#0f172a')
        .text(section.title || 'Section', 48, y);
      y += 22;

      for (const question of section.questions || []) {
        if (y > doc.page.height - 96) {
          doc.addPage();
          y = 48;
        }
        const qText = question.questionText || 'Question';
        const qLines = doc.font('Helvetica').fontSize(10).widthOfString(qText);
        const qHeight = doc.heightOfString(qText, { width: doc.page.width - 96 });
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fill('#334155')
          .text(qText, 48, y, { width: doc.page.width - 96 });
        y += qHeight + 2;

        const answer = formatAnswer(question.answer);
        const aHeight = doc.heightOfString(answer, { width: doc.page.width - 96 });
        if (y + aHeight > doc.page.height - 96) {
          doc.addPage();
          y = 48;
        }
        doc
          .font('Helvetica')
          .fontSize(10)
          .fill('#0f172a')
          .text(answer, 60, y, { width: doc.page.width - 108 });
        y += aHeight + 10;
      }

      y += 8;
    }

    doc.end();
  });
}
