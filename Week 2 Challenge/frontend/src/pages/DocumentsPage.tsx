import { EmptyState } from "../components";

export function DocumentsPage() {
  return (
    <div className="page">
      <h1 className="page-title">Documents</h1>
      <EmptyState
        title="Document management pending"
        description="Document upload and association with expenses will be added in a later milestone."
      />
    </div>
  );
}
