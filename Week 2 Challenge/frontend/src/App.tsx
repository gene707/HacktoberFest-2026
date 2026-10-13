import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components";
import {
  DashboardPage,
  ExpensesPage,
  DocumentsPage,
  SettingsPage,
} from "./pages";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/expenses/new" element={<ExpensesPage />} />
          <Route path="/expenses/:id" element={<ExpensesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
