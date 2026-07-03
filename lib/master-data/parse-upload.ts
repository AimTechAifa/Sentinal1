export type ParsedSheet = {
  headers: string[];
  rows: Record<string, string>[];
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else cur += c;
  }
  out.push(cur.trim());
  return out;
}

export function parseCsvText(text: string): ParsedSheet {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
  return { headers, rows };
}

export async function parseUploadFile(file: File): Promise<ParsedSheet> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return parseCsvText(await file.text());
  }
  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    if (!matrix.length) return { headers: [], rows: [] };
    const headers = matrix[0].map((h) => String(h).trim());
    const rows = matrix.slice(1).map((cells) => {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = String(cells[i] ?? "").trim();
      });
      return row;
    });
    return { headers, rows };
  }
  throw new Error("Unsupported file type. Use .csv or .xlsx");
}

export function applyColumnMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): Record<string, string>[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [fieldKey, fileCol] of Object.entries(mapping)) {
      if (fileCol) mapped[fieldKey] = row[fileCol] ?? "";
    }
    return mapped;
  });
}
