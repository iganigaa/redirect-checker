export interface ProductItem {
  id: string; // Internal ID for React keys
  rowId: string; // ID from the file if present, else generated
  attributes: Record<string, string>; // Dynamic columns (e.g., Color: Red, Size: XL)
  generatedDescription: string | null;
  status: 'idle' | 'pending' | 'success' | 'error';
  errorMessage?: string;
}

export interface ProcessingStats {
  total: number;
  processed: number;
  success: number;
  failed: number;
}

export interface AppError {
  id: string;
  timestamp: Date;
  message: string;
  itemId?: string; // Optional: associated product ID
  itemName?: string; // Optional: associated product name/title
}









