import { Link, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Payments from "./pages/Payments.jsx";
import Money from "./pages/Money.jsx";
import Settings from "./pages/Settings.jsx";
import Checklist from "./pages/Checklist.jsx";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/checklist", label: "Checklist" },
  { to: "/payments", label: "Payments" },
  { to: "/money", label: "Money" },
  { to: "/settings", label: "Settings" },
];

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <img className="brand-mark" src="/favicon.svg" alt="" /> FinTrack
        </Link>
        <nav className="nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/money" element={<Money />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
