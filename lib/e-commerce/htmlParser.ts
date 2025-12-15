import { ProductItem } from './types';

export const parseHtmlFile = (htmlContent: string): ProductItem[] => {
  // Use DOMParser in browser environment
  if (typeof window === 'undefined') {
    throw new Error("HTML parsing is only available in browser environment");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  // Look for any table, preferably with class dataframe, but fallback to first table
  const table = doc.querySelector('table.dataframe') || doc.querySelector('table');

  if (!table) {
    throw new Error("Could not find a <table> in the uploaded HTML.");
  }

  const items: ProductItem[] = [];
  
  // Try to find headers
  const thead = table.querySelector('thead');
  const headerCells = thead 
    ? Array.from(thead.querySelectorAll('th')) 
    : Array.from(table.querySelectorAll('tr')[0]?.querySelectorAll('td, th') || []);

  if (headerCells.length === 0) {
    throw new Error("Table is empty or has no headers.");
  }

  const headers = headerCells.map(th => th.textContent?.trim() || `Column ${Math.random()}`);

  // Determine rows. If we inferred headers from the first row, skip it.
  let rows = Array.from(table.querySelectorAll('tbody tr'));
  if (rows.length === 0 && !thead) {
     // If no tbody, assume all trs are rows, skip first if it was used as header
     const allRows = Array.from(table.querySelectorAll('tr'));
     rows = allRows.slice(1);
  }

  rows.forEach((row, rowIndex) => {
    const cols = row.querySelectorAll('td');
    if (cols.length === 0) return;

    const attributes: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      if (cols[index]) {
        // Use innerText to get clean text, or innerHTML if you want to preserve links etc (usually text is better for AI)
        attributes[header] = cols[index].textContent?.trim() || '';
      }
    });

    // Try to find a meaningful ID. Check for common ID column names, or use Row Index
    const idKey = headers.find(h => /^(id|sku|code|артикул)/i.test(h));
    const rowId = idKey ? attributes[idKey] : `row-${rowIndex + 1}`;

    items.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${rowIndex}-${Date.now()}-${Math.random()}`,
      rowId,
      attributes,
      generatedDescription: null,
      status: 'idle',
    });
  });

  return items;
};


