import { Link, useLocation } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/documents", label: "Documents" },
  { to: "/expenses", label: "Expenses" },
  { to: "/settings", label: "Settings" },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="app-header">
      <div className="app-brand">
        <span className="app-logo" aria-hidden="true">LL</span>
        <span className="app-title">LedgerLeaf</span>
      </div>
      <nav className="app-nav" aria-label="Main navigation">
        {NAV.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`nav-link${location.pathname.startsWith(to) ? " nav-link-active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
