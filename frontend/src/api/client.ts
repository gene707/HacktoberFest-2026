import type {
  Expense,
  ExpenseCreateVariables,
  ExpenseUpdateVariables,
  ExpenseListResponse,
  ApiError,
} from "../types/expenses";

const BASE = "/api/v1/expenses";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiError;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      body = { detail: res.statusText };
    }
    const message = body.detail ?? res.statusText;
    const err = new Error(message);
    (err as unknown as Record<string, unknown>).status = res.status;
    (err as unknown as Record<string, unknown>).apiError = body;
    throw err;
  }
  return (await res.json()) as T;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  return handleResponse<T>(res);
}

export async function apiHealth(): Promise<{ status: string; version: string }> {
  return request<{ status: string; version: string }>("/api/health");
}

export async function listExpenses(
  skip = 0,
  limit = 50,
): Promise<ExpenseListResponse> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  return request<ExpenseListResponse>(`${BASE}?${params}`);
}

export async function getExpense(id: string): Promise<Expense> {
  return request<Expense>(`${BASE}/${id}`);
}

export async function createExpense(
  variables: ExpenseCreateVariables,
): Promise<Expense> {
  return request<Expense>(`${BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variables),
  });
}

export async function updateExpense(
  id: string,
  variables: ExpenseUpdateVariables,
): Promise<Expense> {
  return request<Expense>(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variables),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Delete failed: ${res.status}`);
  }
}
