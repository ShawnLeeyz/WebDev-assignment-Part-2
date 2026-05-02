import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// Set in vite.config define: repo path for GitHub Pages; "" locally.
const routerBasename =
  typeof __ROUTER_BASENAME__ !== "undefined" && __ROUTER_BASENAME__
    ? __ROUTER_BASENAME__
    : undefined;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
