const escapeCell = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (headers: string[], rows: unknown[][]) =>
  [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");

/** BOM giup Excel doc dung tieng Viet co dau. */
export const withBom = (csv: string) => `﻿${csv}`;
