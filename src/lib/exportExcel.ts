import * as XLSX from "xlsx";

/**
 * Xuat du lieu mang JSON ra file Excel (.xlsx) va tai truc tiep tren trinh duyet
 */
export function exportToExcel(
  data: Record<string, any>[],
  fileName: string = "FBShop_Export",
  sheetName: string = "DuLieu"
) {
  if (!data || data.length === 0) {
    alert("Không có dữ liệu để xuất Excel!");
    return;
  }

  // Tao worksheet tu du lieu json
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Tinh toan do rong cot tu dong
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const val = row[key] ? String(row[key]) : "";
      if (val.length > maxLen) maxLen = Math.min(val.length, 40);
    });
    return { wch: Math.max(maxLen + 4, 12) };
  });
  worksheet["!cols"] = colWidths;

  // Tao workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Ghi file va tai ve
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
}

/**
 * Xuat nhieu bang du lieu thanh nhieu sheet trong cung 1 file Excel.
 * Sheet rong duoc ghi 1 dong "Không có dữ liệu" thay vi bo qua.
 */
export function exportSheetsToExcel(
  sheets: { name: string; data: Record<string, any>[] }[],
  fileName: string = "FBShop_Export"
) {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const rows = sheet.data.length ? sheet.data : [{ "Ghi chú": "Không có dữ liệu" }];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(
        12,
        Math.min(
          44,
          Math.max(key.length, ...rows.map((r) => (r[key] === undefined ? 0 : String(r[key]).length))) + 3
        )
      ),
    }));
    // Ten sheet Excel toi da 31 ky tu
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  }
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
}
