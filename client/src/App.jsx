import { useState, useEffect } from "react";
import { checkHealth } from "./services/api";
import InvoiceUploader from "./components/InvoiceUploader";
import "./App.css";

function App() {
  const [status, setStatus] = useState("checking"); // 'checking' | 'connected' | 'error'
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function verifyBackend() {
      try {
        const data = await checkHealth();
        if (data.success) {
          setStatus("connected");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage("Unexpected response from the backend.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          "Unable to connect to the backend. Make sure the server is running.",
        );
      }
    }

    verifyBackend();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Invoice-to-Accounting Sync</h1>
        <p className="app-subtitle">
          Automate invoice processing and accounting synchronization
        </p>
      </header>

      <main className="app-main">
        <div className={`status-card status-${status}`}>
          <div className="status-indicator">
            <span className={`status-dot ${status}`} />
            <span className="status-label">
              {status === "checking" && "Checking connection…"}
              {status === "connected" && "Backend Connected"}
              {status === "error" && "Connection Failed"}
            </span>
          </div>

          {message && <p className="status-message">{message}</p>}

          {status === "error" && (
            <button
              className="retry-btn"
              onClick={() => {
                setStatus("checking");
                setMessage("");
                checkHealth()
                  .then((data) => {
                    setStatus("connected");
                    setMessage(data.message);
                  })
                  .catch(() => {
                    setStatus("error");
                    setMessage(
                      "Unable to connect to the backend. Make sure the server is running.",
                    );
                  });
              }}
            >
              Retry
            </button>
          )}
        </div>

        {/* Show uploader only when backend is connected */}
        {status === "connected" && <InvoiceUploader />}
      </main>

      <footer className="app-footer">
        <p>Phase 7 — End-to-End Integration</p>
      </footer>
    </div>
  );
}

export default App;
