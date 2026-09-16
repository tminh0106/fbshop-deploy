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
