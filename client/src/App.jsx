import { Routes, Route, Link, NavLink } from "react-router-dom";
import BookingPage from "./pages/BookingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import DriversPage from "./pages/DriversPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <span className="brand">CabsOnline</span>
        <nav>
          <NavLink to="/" end>
            Book a taxi
          </NavLink>
          <NavLink to="/track">Track</NavLink>
          <NavLink to="/admin">Admin</NavLink>
          <NavLink to="/drivers">Drivers</NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/drivers" element={<DriversPage />} />
        </Routes>
      </main>
      <footer className="footer">
        <Link to="/">Passenger booking</Link>
        {" · "}
        <Link to="/track">Track booking</Link>
        {" · "}
        <Link to="/admin">Admin panel</Link>
        {" · "}
        <Link to="/drivers">Drivers</Link>
      </footer>
    </div>
  );
}
