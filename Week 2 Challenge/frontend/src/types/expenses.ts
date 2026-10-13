export type ExtractionStatus = "pending" | "extracting" | "extracted" | "failed" | "manual";
export type ReviewStatus = "unreviewed" | "pending_review" | "reviewed" | "flagged";

export interface Expense {
  id: string;
  vendor: string;
  documentType: string;
  documentDate: string; // ISO date string YYYY-MM-DD
  documentNumber: string | null;
  currency: string;
  subtotal: string; // decimal string to preserve precision
  tax: string;
  total: string;
  category: string;
  originalDocumentReference: string | null;
  extractionStatus: ExtractionStatus;
  reviewStatus: ReviewStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCreateVariables {
  vendor: string;
  documentType: string;
  documentDate: string;
  documentNumber?: string;
  currency: string;
  subtotal: string;
  tax: string;
  total: string;
  category: string;
  originalDocumentReference?: string;
  notes?: string;
}

export interface ExpenseUpdateVariables {
  vendor?: string;
  documentType?: string;
  documentDate?: string;
  documentNumber?: string | null;
  currency?: string;
  subtotal?: string;
  tax?: string;
  total?: string;
  category?: string;
  originalDocumentReference?: string | null;
  notes?: string | null;
  extractionStatus?: ExtractionStatus;
  reviewStatus?: ReviewStatus;
}

export interface ApiError {
  detail: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface ExpenseListResponse {
  items: Expense[];
  total: number;
}
