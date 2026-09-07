import { useState, useEffect } from "react";
import { checkHealth } from "./services/api";
import InvoiceUploader from "./components/InvoiceUploader";
import "./App.css";

function App() {
  const [status, setStatus] = useState("checking"); // 'checking' | 'connected' | 'error'
  const [message, setMessage] = useState("");

  async function verifyBackend() {
    setStatus("checking");
    setMessage("");
    try {
      const data = await checkHealth();
      if (data.success) {
        setStatus("connected");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage("Unexpected response from the backend server.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(
        "Unable to connect to the backend server. Please verify the server is running on port 5000.",
      );
    }
  }

  useEffect(() => {
    verifyBackend();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-badge-row">
          <div className={`connection-pill status-${status}`}>
            <span className={`status-dot ${status}`} aria-hidden="true" />
            <span className="status-pill-text">
              {status === "checking" && "Connecting…"}
              {status === "connected" && "System Online"}
              {status === "error" && "Offline"}
            </span>
          </div>
        </div>

        <h1 className="app-title">Invoice Accounting Sync</h1>
        <p className="app-subtitle">
          Automate invoice processing and Google Sheets synchronization
        </p>
      </header>

      <main className="app-main">
        {/* If connection error, show helpful recovery alert */}
        {status === "error" && (
          <div className="connection-error-card" role="alert">
            <div className="connection-error-body">
              <span className="error-icon" aria-hidden="true">
                ⚠️
              </span>
              <div>
                <h3 className="connection-error-title">Backend Disconnected</h3>
                <p className="connection-error-msg">{message}</p>
              </div>
            </div>
            <button type="button" className="retry-btn" onClick={verifyBackend}>
              Retry Connection
            </button>
          </div>
        )}

        {/* If checking connection */}
        {status === "checking" && (
          <div className="loading-state-card" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <p className="loading-text">Connecting to server…</p>
          </div>
        )}

        {/* Show uploader when connected */}
        {status === "connected" && <InvoiceUploader />}
      </main>

      <footer className="app-footer">
        <p>Phase 8 — UI Polish</p>
      </footer>
    </div>
  );
}

export default App;
