import ExcelJS from 'exceljs';

/** ExcelJS can throw on undefined; keep cells as string | number only */
export function cellText(v: unknown): string {
  if (v == null) return '-';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
  return String(v);
}

/** Bold header, wide columns, wrap text, freeze first row */
export function styleDataSheetHeader(
  sheet: ExcelJS.Worksheet,
  columnCount: number,
): void {
  const header = sheet.getRow(1);
  header.font = { bold: true, size: 12 };
  header.height = 30;
  for (let i = 1; i <= columnCount; i++) {
    const cell = header.getCell(i);
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 24;
      row.alignment = { vertical: 'middle', wrapText: true };
    }
  });

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
