import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface AssetPdfRow {
  assetName?: string;
  customAssetId?: string;
  status?: string;
  condition?: string;
  storeId?: string;
  ownerUserId?: string;
  expiryDate?: string;
  renewalDate?: string;
  utilizationPercent?: number;
  customFields?: Record<string, unknown>;
}

export function exportAssetsToPdf(
  rows: AssetPdfRow[],
  filename = "assets-report.pdf",
  localeLabels: Record<string, string> = {},
  storeNames: Record<string, string> = {},
) {
  if (!rows || rows.length === 0) return false;
  const t = (key: string, fallback: string) => localeLabels[key] || fallback;
  const storeLabel = (storeId?: string) =>
    (storeId && storeNames[storeId]) || storeId || "";

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(t("assetReportsTitle", "Asset Register Report"), 40, 32);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(t("generatedOn", "Generated on") + ": " + new Date().toLocaleString(), 40, 46);
  doc.setTextColor(0, 0, 0);

  const headers = [
    t("assetName", "Asset Name"),
    t("assetId", "Asset ID"),
    t("status", "Status"),
    t("condition", "Condition"),
    t("store", "Store"),
    t("owner", "Owner"),
    t("expiryDate", "Expiry"),
    t("renewalDate", "Renewal"),
    t("utilization", "Utilization"),
    t("customFields", "Custom Fields"),
  ];

  const body = rows.map((row) => [
    String(row.assetName ?? ""),
    String(row.customAssetId ?? ""),
    String(row.status ?? ""),
    String(row.condition ?? ""),
    String(row.storeId != null ? storeLabel(row.storeId) : ""),
    String(row.ownerUserId ?? ""),
    row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : "",
    row.renewalDate ? new Date(row.renewalDate).toLocaleDateString() : "",
    typeof row.utilizationPercent === "number" ? `${row.utilizationPercent}%` : "",
    row.customFields && typeof row.customFields === "object"
      ? Object.entries(row.customFields)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")
      : "",
  ]);

  autoTable(doc, {
    startY: 72,
    head: [headers],
    body,
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: [14, 116, 199], fontSize: 9 },
    columnStyles: {
      9: { cellWidth: 120 },
    },
  });

  doc.save(filename);
  return true;
}

export async function exportAssetDetailPdf(
  asset: any,
  history: any[],
  filename?: string,
  localeLabels: Record<string, string> = {},
  storeNames: Record<string, string> = {},
) {
  if (!asset) return false;
  const t = (key: string, fallback: string) => localeLabels[key] || fallback;
  const storeLabel = (storeId?: string) =>
    (storeId && storeNames[storeId]) || storeId || "—";
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(String(asset.assetName || "Asset Detail"), 40, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${t("assetId", "Asset ID")}: ${asset.customAssetId || asset.id}`, 40, 56);
  doc.setTextColor(0, 0, 0);

  const fields = [
    [t("status", "Status"), asset.status || "—"],
    [t("condition", "Condition"), asset.condition || "—"],
    [t("store", "Store"), storeLabel(asset.storeId)],
    [t("owner", "Owner"), asset.ownerUserId || asset.userId || "—"],
    [t("expiryDate", "Expiry Date"), asset.expiryDate ? new Date(asset.expiryDate).toLocaleDateString() : "—"],
    [t("renewalDate", "Renewal Date"), asset.renewalDate ? new Date(asset.renewalDate).toLocaleDateString() : "—"],
    [t("lastMaintenance", "Last Maintenance"), asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : "—"],
    [t("utilization", "Utilization"), typeof asset.utilizationPercent === "number" ? `${asset.utilizationPercent}%` : "—"],
  ];

  autoTable(doc, {
    startY: 84,
    head: [[t("field", "Field"), t("value", "Value")]],
    body: fields,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [14, 116, 199] },
  });

  if (asset.customFields && typeof asset.customFields === "object") {
    const cfEntries = Object.entries(asset.customFields).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    );
    if (cfEntries.length) {
      const startY = (doc as any).lastAutoTable?.finalY || 160;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(t("customFields", "Custom Fields"), 40, startY + 20);
      autoTable(doc, {
        startY: startY + 28,
        head: [[t("field", "Field"), t("value", "Value")]],
        body: cfEntries.map(([k, v]) => [k, String(v)]),
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [14, 116, 199] },
      });
    }
  }

  if (Array.isArray(history) && history.length) {
    const startY = (doc as any).lastAutoTable?.finalY || 220;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(t("history", "History"), 40, startY + 20);
    autoTable(doc, {
      startY: startY + 28,
      head: [
        [t("date", "Date"), t("action", "Action"), t("user", "User"), t("note", "Note")],
      ],
      body: history.map((h: any) => [
        h.date ? new Date(h.date).toLocaleString() : "",
        String(h.action || ""),
        String(h.user || ""),
        String(h.note || ""),
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [14, 116, 199] },
    });
  }

  doc.save(filename || `${String(asset.assetName || "asset").replace(/[^\w\-]/g, "_")}.pdf`);
  return true;
}
