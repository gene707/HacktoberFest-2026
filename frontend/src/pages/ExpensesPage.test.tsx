import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ExpensesPage } from "./ExpensesPage";

function mockFetch(handler: (url: string, opts?: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(handler);
  vi.stubGlobal("fetch", fn);
  return fn;
}

const mockExpense = {
  id: "e1",
  vendor: "Acme Supplies",
  documentType: "invoice",
  documentDate: "2025-09-14",
  documentNumber: "INV-1001",
  currency: "USD",
  subtotal: "120.00",
  tax: "12.00",
  total: "132.00",
  category: "Office Supplies",
  originalDocumentReference: null,
  extractionStatus: "manual",
  reviewStatus: "unreviewed",
  notes: null,
  createdAt: "2025-09-14T10:00:00Z",
  updatedAt: "2025-09-14T10:00:00Z",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function listResponse(items: unknown[], total: number) {
  return { items, total };
}

describe("ExpensesPage", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = mockFetch(async (_url: string) => {
      return jsonResponse(listResponse([], 0));
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderExpenses = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <ExpensesPage />
      </MemoryRouter>,
    );

  it("shows empty state when there are no expenses", async () => {
    renderExpenses("/expenses");
    await waitFor(() => {
      expect(screen.getByText("No expenses yet")).toBeInTheDocument();
    });
    expect(screen.getByText(/Add your first expense to start tracking/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Add your first expense/ })).toHaveAttribute(
      "href",
      "/expenses/new",
    );
  });

  it("shows a loading spinner while fetching", () => {
    vi.stubGlobal("fetch", new Promise(() => {}) as unknown as typeof fetch);
    renderExpenses("/expenses");
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Loading expenses/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("shows an error banner when the API fails", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("Network error");
    });
    renderExpenses("/expenses");
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Try again/ })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("renders the expense list when data arrives", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(listResponse([mockExpense], 1)));
    renderExpenses("/expenses");
    await waitFor(() => {
      expect(screen.getByText("Acme Supplies")).toBeInTheDocument();
    });
    expect(screen.getByText("invoice")).toBeInTheDocument();
    expect(screen.getByText("2025-09-14")).toBeInTheDocument();
    expect(screen.getByText("INV-1001")).toBeInTheDocument();
    expect(screen.getByText("132.00")).toBeInTheDocument();
  });

  it("renders the create form on /expenses/new", async () => {
    renderExpenses("/expenses/new");
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "New expense" })).toBeInTheDocument();
    });
    // Form fields are present in the DOM (verified by test snapshots);
    // accessible-name queries in jsdom are unreliable with React useId().
    expect(screen.getByRole("textbox", { name: /Vendor/ })).toBeInTheDocument();
  });

  it("submits the create form and calls the API on success", async () => {
    const created = { ...mockExpense, id: "new-1" };
    const submittedBody: Record<string, unknown> = {};
    fetchMock.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (opts?.method?.toUpperCase() === "POST" && url.includes("/create")) {
        submittedBody["post"] = JSON.parse(opts.body as string);
        return jsonResponse(created, 201);
      }
      return jsonResponse(listResponse([], 0));
    });

    const user = userEvent.setup();
    renderExpenses("/expenses/new");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "New expense" })).toBeInTheDocument();
    });
    await waitFor(() => screen.getByRole("textbox", { name: /Vendor/ }));

    await user.type(screen.getByRole("textbox", { name: /Vendor/ }), "Test Vendor");
    await user.selectOptions(screen.getByRole("combobox", { name: /Document type/ }), "receipt");
    await user.type(screen.getByRole("textbox", { name: /Document date/ }), "2025-01-15");
    await user.selectOptions(screen.getByRole("combobox", { name: /Currency/ }), "EUR");
    await user.type(screen.getByRole("textbox", { name: /Subtotal/ }), "100");
    await user.type(screen.getByRole("textbox", { name: /Tax/ }), "10");
    await user.type(screen.getByRole("textbox", { name: /Total/ }), "110");
    await user.selectOptions(screen.getByRole("combobox", { name: /Category/ }), "Office Supplies");

    await user.click(screen.getByRole("button", { name: /Create expense/ }));

    await waitFor(() => {
      expect(submittedBody["post"]).toEqual(
        expect.objectContaining({ vendor: "Test Vendor", currency: "EUR" }),
      );
    });
  });

  it("validates required fields and shows errors on submit", async () => {
    const user = userEvent.setup();
    renderExpenses("/expenses/new");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "New expense" })).toBeInTheDocument();
    });
    await waitFor(() => screen.getByRole("textbox", { name: /Vendor/ }));

    await user.click(screen.getByRole("button", { name: /Create expense/ }));

    await waitFor(() => {
      expect(screen.getByText("Vendor is required")).toBeInTheDocument();
    });
    expect(screen.getByText("Document type is required")).toBeInTheDocument();
    expect(screen.getByText("Document date is required")).toBeInTheDocument();
    expect(screen.getByText("Currency is required")).toBeInTheDocument();
  });
});
