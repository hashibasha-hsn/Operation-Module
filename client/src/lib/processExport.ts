import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type ProcessExportRow = Record<string, string | number>;

export type ProcessQuestionExportLabels = {
  processTitle: string;
  formId: string;
  section: string;
  questionNo: string;
  questionText: string;
  questionType: string;
  required: string;
  options: string;
};

function formatQuestionOptions(options: unknown): string {
  if (!options || typeof options !== 'object') return '';

  const record = options as Record<string, unknown>;
  if (Array.isArray(record.choices)) {
    return record.choices.map(String).join('; ');
  }
  if (Array.isArray(record.options)) {
    return record.options.map(String).join('; ');
  }
  if (Array.isArray(record.items)) {
    return record.items.map(String).join('; ');
  }

  try {
    return JSON.stringify(options);
  } catch {
    return '';
  }
}

export function buildProcessQuestionExportRows(
  processes: any[],
  labels: ProcessQuestionExportLabels,
  formatFormId: (id?: string) => string,
): ProcessExportRow[] {
  const rows: ProcessExportRow[] = [];

  for (const process of processes) {
    const sections = [...(process.sections ?? [])].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );

    for (const section of sections) {
      const questions = [...(section.questions ?? [])].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      );

      questions.forEach((question, index) => {
        rows.push({
          [labels.processTitle]: process.title || '-',
          [labels.formId]: formatFormId(process.id),
          [labels.section]: section.title || '-',
          [labels.questionNo]: index + 1,
          [labels.questionText]: question.questionText || '-',
          [labels.questionType]: question.questionType || '-',
          [labels.required]: question.isRequired ? 'Yes' : 'No',
          [labels.options]: formatQuestionOptions(question.options),
        });
      });
    }
  }

  return rows;
}

function escapeCsvValue(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportProcessesToCsv(rows: ProcessExportRow[], filename = 'processes.csv') {
  if (!rows.length) return false;

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header] ?? '')).join(',')),
  ];

  downloadBlob(`\uFEFF${lines.join('\r\n')}`, filename, 'text/csv;charset=utf-8;');
  return true;
}

export function exportProcessesToExcel(rows: ProcessExportRow[], filename = 'processes.xlsx') {
  if (!rows.length) return false;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Process Questions');
  XLSX.writeFile(workbook, filename);
  return true;
}

export function exportProcessesToPdf(rows: ProcessExportRow[], filename = 'processes.pdf') {
  if (!rows.length) return false;

  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => String(row[header] ?? '')));

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text('Process Questions Export', 40, 32);

  autoTable(doc, {
    startY: 44,
    head: [headers],
    body,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [14, 116, 199] },
  });

  doc.save(filename);
  return true;
}
