/**
 * MKR Academy - Exportable Reports System Service
 * Generates accurate Revenue, User, and Activity reports with date filters,
 * and exports to CSV, Excel-compatible format, or formatted print.
 */

import { Order, UserProfile, Product, Purchase } from '../types';
import { UserSession } from './sessionService';

export type ReportCategory = 'revenue' | 'users' | 'activity';

export type ReportDateFilter =
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | 'this_month'
  | 'last_month'
  | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRangeFromFilter(filter: ReportDateFilter, customStart?: string, customEnd?: string): DateRange {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (filter) {
    case 'today':
      return { startDate: todayStart, endDate: todayEnd };

    case 'yesterday': {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return { startDate: yStart, endDate: yEnd };
    }

    case '7days': {
      const start7 = new Date(todayStart);
      start7.setDate(start7.getDate() - 6);
      return { startDate: start7, endDate: todayEnd };
    }

    case '30days': {
      const start30 = new Date(todayStart);
      start30.setDate(start30.getDate() - 29);
      return { startDate: start30, endDate: todayEnd };
    }

    case 'this_month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { startDate: monthStart, endDate: todayEnd };
    }

    case 'last_month': {
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { startDate: prevMonthStart, endDate: prevMonthEnd };
    }

    case 'custom':
      if (customStart && customEnd) {
        return {
          startDate: new Date(`${customStart}T00:00:00`),
          endDate: new Date(`${customEnd}T23:59:59`)
        };
      }
      return { startDate: todayStart, endDate: todayEnd };

    default:
      return { startDate: todayStart, endDate: todayEnd };
  }
}

/**
 * Filter items by timestamp within the date range
 */
export function filterItemsByDate<T>(
  items: T[],
  getDateFn: (item: T) => string | undefined,
  range: DateRange
): T[] {
  return items.filter((item) => {
    const raw = getDateFn(item);
    if (!raw) return false;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return false;
    return d >= range.startDate && d <= range.endDate;
  });
}

/**
 * Helper to download text data as a file
 */
export function triggerFileDownload(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Clean string for CSV cell (escapes double quotes and commas)
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export generic tabular data to CSV
 */
export function exportTableToCsv(
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const headerLine = headers.map(escapeCsv).join(',');
  const rowLines = rows.map((r) => r.map(escapeCsv).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n'); // UTF-8 BOM for Excel compatibility
  triggerFileDownload(csvContent, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export tabular data as XML/Excel-compatible spreadsheet (.xls)
 */
export function exportTableToExcel(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  sheetName: string = 'MKR Academy Report'
) {
  let xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${sheetName}">
  <Table>
   <Row>`;

  headers.forEach((h) => {
    xml += `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
  });
  xml += `</Row>`;

  rows.forEach((row) => {
    xml += `<Row>`;
    row.forEach((val) => {
      const isNum = typeof val === 'number';
      xml += `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(String(val ?? ''))}</Data></Cell>`;
    });
    xml += `</Row>`;
  });

  xml += `</Table></Worksheet></Workbook>`;

  triggerFileDownload(
    xml,
    filename.endsWith('.xls') ? filename : `${filename}.xls`,
    'application/vnd.ms-excel'
  );
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
}
