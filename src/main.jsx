import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary";
import EasterEggLayer from "./components/EasterEggLayer";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
      <EasterEggLayer />
    </AppErrorBoundary>
  </React.StrictMode>
);
