// =======================================================
// XUAT BAO CAO PDF (FR-34): mo trang in rieng cho bao cao dang xem,
// nguoi dung chon "Luu duoi dang PDF" trong hop thoai in cua trinh duyet.
// =======================================================

export type PrintTable = {
  heading: string;
  columns: string[];
  rows: (string | number)[][];
};

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const cell = (v: string | number) =>
  typeof v === "number" ? `<td class="n">${v.toLocaleString("vi-VN")}</td>` : `<td>${esc(v)}</td>`;

// Tra ve false neu trinh duyet chan cua so bat len
export function printReport(opts: {
  title: string;
  period: string;
  summary: [label: string, value: string | number][];
  tables: PrintTable[];
}): boolean {
  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) return false;

  const summary = opts.summary
    .map(([k, v]) => `<tr><th>${esc(k)}</th>${cell(v)}</tr>`)
    .join("");
  const tables = opts.tables
    .map(
      (t) => `<h2>${esc(t.heading)}</h2>
      <table><thead><tr>${t.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${
        t.rows.length
          ? t.rows.map((r) => `<tr>${r.map(cell).join("")}</tr>`).join("")
          : `<tr><td colspan="${t.columns.length}" class="empty">Không có dữ liệu</td></tr>`
      }</tbody></table>`
    )
    .join("");

  win.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>${esc(opts.title)}</title>
<style>
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #111; margin: 24px; }
  .shop { font-weight: bold; text-transform: uppercase; }
  h1 { text-align: center; font-size: 17pt; margin: 18px 0 4px; text-transform: uppercase; }
  .period { text-align: center; font-style: italic; margin-bottom: 16px; }
  h2 { font-size: 13pt; margin: 18px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { border: 1px solid #444; padding: 4px 6px; text-align: left; vertical-align: top; }
  thead th { background: #eee; }
  td.n { text-align: right; white-space: nowrap; }
  td.empty { text-align: center; font-style: italic; }
  table.summary { width: 60%; }
  table.summary th { width: 55%; font-weight: normal; background: #f6f6f6; }
  .sign { display: flex; justify-content: flex-end; margin-top: 28px; text-align: center; }
  .sign div { width: 40%; }
  @page { size: A4; margin: 14mm; }
</style></head><body>
<div class="shop">FBSHOP – Cửa hàng cầu lông</div>
<div>Báo cáo lập lúc: ${esc(new Date().toLocaleString("vi-VN"))}</div>
<h1>${esc(opts.title)}</h1>
<div class="period">Kỳ báo cáo: ${esc(opts.period)}</div>
<table class="summary"><tbody>${summary}</tbody></table>
${tables}
<div class="sign"><div><b>Người lập báo cáo</b><br><i>(Ký, ghi rõ họ tên)</i></div></div>
<script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`);
  win.document.close();
  return true;
}
