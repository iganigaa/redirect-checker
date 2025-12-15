import { ProductItem } from './types';

export const parseProgressCsv = (csvContent: string): Map<string, string> => {
  const lines = csvContent.split('\n');
  const processedMap = new Map<string, string>();
  
  // This is a naive parser. In a real scenario with dynamic columns, restoring from CSV 
  // without re-uploading the exact same HTML structure is tricky.
  // We will try to match by RowID (first column usually).
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by comma, respecting quotes is hard without a lib.
    // We assume the generated CSV puts the AI result in the LAST column.
    // And the ID in the FIRST column.
    
    const firstComma = line.indexOf(',');
    if (firstComma === -1) continue;
    
    const id = line.substring(0, firstComma).replace(/^"|"$/g, '');
    
    // To assume success, we just check if the ID exists. 
    // We don't strictly load the text back into the UI because the UI is driven by the HTML source.
    processedMap.set(id, "Done");
  }
  return processedMap;
};

export const parseSourceCsv = (csvContent: string): ProductItem[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  // Normalize line endings
  const content = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Filter empty rows
  const validRows = rows.filter(r => r.length > 0 && r.some(c => c.trim()));
  if (validRows.length === 0) return [];

  // Determine headers
  // Logic: 
  // 1. If 4 columns and first row doesn't look like headers (no ID/Name), assume the specific format.
  // 2. Else assume first row is header.

  const firstRow = validRows[0];
  const isGenericHeader = firstRow.some(c => /id|name|title|sku|артикул|название/i.test(c));
  
  let headers: string[] = [];
  let dataRows: string[][] = [];

  // Special logic to handle the python script format (4 cols, no headers)
  if (!isGenericHeader && firstRow.length === 4) {
     headers = ['ID', 'Название студии', 'Slug', 'Описание'];
     dataRows = validRows; // Include first row as data since there are no headers
  } else {
     // Generic CSV
     headers = firstRow.map(h => h.trim());
     dataRows = validRows.slice(1);
  }

  // Deduplicate headers to avoid key collisions
  const uniqueHeaders = headers.map((h, i) => {
      const count = headers.slice(0, i).filter(p => p === h).length;
      return count === 0 ? h : `${h}_${count + 1}`;
  });

  return dataRows.map((row, index) => {
    const attributes: Record<string, string> = {};
    uniqueHeaders.forEach((header, colIndex) => {
      // Use empty string if column is missing
      attributes[header] = row[colIndex] ? row[colIndex].trim() : '';
    });

    // Try to find a meaningful ID key
    const idKey = uniqueHeaders.find(h => /^(id|sku|code|артикул)/i.test(h)) || uniqueHeaders[0];
    const rowId = attributes[idKey] || `row-${index + 1}`;

    return {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      rowId,
      attributes,
      generatedDescription: null,
      status: 'idle'
    };
  });
};

export const generateCsv = (items: ProductItem[]): string => {
  if (items.length === 0) return '';

  // Filter out 'AI_Generated_Description' from attributes if it exists there,
  // to avoid duplication since we append it explicitly at the end.
  const attributeKeys = Object.keys(items[0].attributes).filter(key => key !== 'AI_Generated_Description');
  
  const headers = ['Row_ID', ...attributeKeys, 'AI_Generated_Description'];
  
  const csvRows = items.map(item => {
    const rowId = `"${item.rowId.replace(/"/g, '""')}"`;
    
    const attrValues = attributeKeys.map(key => {
      const val = item.attributes[key] || '';
      return `"${val.replace(/"/g, '""')}"`;
    });

    // Prefer the newly generated description, fallback to existing attribute if available (e.g. from re-upload)
    const desc = item.generatedDescription || item.attributes['AI_Generated_Description'] || '';
    const escapedDesc = `"${desc.replace(/"/g, '""')}"`;

    return [rowId, ...attrValues, escapedDesc].join(',');
  });

  return [headers.join(','), ...csvRows].join('\n');
};

export const downloadCsv = (content: string, filename: string) => {
  if (typeof window === 'undefined') return;
  
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};




