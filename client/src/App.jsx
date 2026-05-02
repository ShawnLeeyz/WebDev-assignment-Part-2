import { Routes, Route, Link, NavLink } from "react-router-dom";
import BookingPage from "./pages/BookingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <span className="brand">CabsOnline</span>
        <nav>
          <NavLink to="/" end>
            Book a taxi
          </NavLink>
          <NavLink to="/admin">Admin</NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <footer className="footer">
        <Link to="/">Passenger booking</Link>
        {" · "}
        <Link to="/admin">Admin panel</Link>
      </footer>
    </div>
  );
}
