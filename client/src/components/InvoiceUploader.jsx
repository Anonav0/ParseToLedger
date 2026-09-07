import { useState, useRef, useEffect } from "react";
import { uploadInvoice } from "../services/api";
import InvoiceResult from "./InvoiceResult";
import "./InvoiceUploader.css";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const STAGES = [
  { key: "uploading", label: "Uploading invoice..." },
  { key: "extracting", label: "Extracting invoice text..." },
  { key: "processing_ai", label: "Analyzing invoice..." },
  { key: "validating", label: "Validating invoice data..." },
  { key: "syncing", label: "Syncing with Google Sheets..." },
];

/**
 * Format bytes into a human-readable string.
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function InvoiceUploader() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState("idle"); // 'idle' | 'processing' | 'completed' | 'failed'
  const [currentStage, setCurrentStage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  const fileInputRef = useRef(null);
  const stageTimeoutsRef = useRef([]);

  function clearStageTimeouts() {
    stageTimeoutsRef.current.forEach(clearTimeout);
    stageTimeoutsRef.current = [];
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearStageTimeouts();
  }, []);

  /**
   * Client-side validation before upload.
   */
  function validateFile(file) {
    if (!file) {
      return "Please select a PDF invoice.";
    }
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return "Only PDF files are allowed.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `The selected file is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
    }
    return null;
  }

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    clearStageTimeouts();
    setSelectedFile(file);
    setUploadState("idle");
    setCurrentStage("");
    setResult(null);
    setError("");
    setValidationErrors([]);
  }

  async function handleUpload() {
    // Client-side validation
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setUploadState("failed");
      setCurrentStage("failed");
      return;
    }

    // Atomic reset before upload attempt
    clearStageTimeouts();
    setError("");
    setValidationErrors([]);
    setResult(null);
    setUploadState("processing");
    setCurrentStage("uploading");

    // Advance visual stages during request lifecycle
    stageTimeoutsRef.current.push(
      setTimeout(() => setCurrentStage("extracting"), 600),
    );
    stageTimeoutsRef.current.push(
      setTimeout(() => setCurrentStage("processing_ai"), 1800),
    );
    stageTimeoutsRef.current.push(
      setTimeout(() => setCurrentStage("validating"), 4200),
    );
    stageTimeoutsRef.current.push(
      setTimeout(() => setCurrentStage("syncing"), 5600),
    );

    try {
      const data = await uploadInvoice(selectedFile);
      clearStageTimeouts();
      setCurrentStage("completed");
      setUploadState("completed");
      setResult(data);
    } catch (err) {
      clearStageTimeouts();
      setCurrentStage("failed");
      setUploadState("failed");
      setError(
        err.message || "Unable to process the invoice. Please try again.",
      );
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        setValidationErrors(err.errors);
      }
    }
  }

  function handleRetry() {
    clearStageTimeouts();
    setError("");
    setValidationErrors([]);
    setResult(null);
    setUploadState("idle");
    setCurrentStage("");
  }

  function handleReset() {
    clearStageTimeouts();
    setSelectedFile(null);
    setUploadState("idle");
    setCurrentStage("");
    setResult(null);
    setError("");
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const isProcessing = uploadState === "processing";
  const activeStageObj = STAGES.find((s) => s.key === currentStage);

  return (
    <div className="uploader-card">
      <h2 className="uploader-title">Process & Sync Invoice</h2>

      {/* File picker */}
      <div className="file-input-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={isProcessing}
          id="invoice-file-input"
        />

        {selectedFile && uploadState !== "completed" && (
          <div className="file-info">
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">
              {formatFileSize(selectedFile.size)}
            </span>
          </div>
        )}
      </div>

      {/* Progress tracker during active processing */}
      {isProcessing && (
        <div className="processing-progress-container">
          <div className="processing-current-status">
            <span className="processing-spinner" />
            <span className="processing-status-text">
              {activeStageObj ? activeStageObj.label : "Processing invoice..."}
            </span>
          </div>

          <div className="stepped-tracker">
            {STAGES.map((stage, idx) => {
              const stageIdx = STAGES.findIndex((s) => s.key === currentStage);
              const isDone = stageIdx > idx;
              const isActive = stageIdx === idx;
              return (
                <div
                  key={stage.key}
                  className={`step-item ${isDone ? "step-done" : ""} ${
                    isActive ? "step-active" : ""
                  }`}
                >
                  <div className="step-circle">{isDone ? "✓" : idx + 1}</div>
                  <span className="step-label">
                    {stage.key === "uploading" && "Upload"}
                    {stage.key === "extracting" && "Extraction"}
                    {stage.key === "processing_ai" && "AI Analysis"}
                    {stage.key === "validating" && "Validation"}
                    {stage.key === "syncing" && "Sheets Sync"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload action button */}
      {uploadState !== "completed" && (
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing
            ? activeStageObj
              ? activeStageObj.label
              : "Processing invoice..."
            : "Upload & Sync to Google Sheets"}
        </button>
      )}

      {/* Structured Invoice Result */}
      {uploadState === "completed" && result?.invoice && (
        <InvoiceResult
          invoice={result.invoice}
          sync={result.sync}
          onReset={handleReset}
        />
      )}

      {/* Fallback Raw Text Result */}
      {uploadState === "completed" && !result?.invoice && result?.text && (
        <div className="upload-result success">
          <p className="result-title">✓ {result.message}</p>
          <div className="extracted-text-section">
            <h3 className="extracted-text-title">Invoice Text Extracted</h3>
            <pre className="extracted-text-content">{result.text}</pre>
          </div>
          <button className="upload-btn secondary" onClick={handleReset}>
            Process Another Invoice
          </button>
        </div>
      )}

      {/* Error state with atomic Retry */}
      {uploadState === "failed" && error && (
        <div className="upload-result error">
          <p className="error-message">{error}</p>

          {validationErrors.length > 0 && (
            <div className="validation-errors-section">
              <p className="validation-errors-title">Validation Details:</p>
              <ul className="validation-errors-list">
                {validationErrors.map((item, idx) => (
                  <li key={idx} className="validation-error-item">
                    <strong className="validation-field-name">
                      {item.field}:
                    </strong>{" "}
                    <span>{item.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="retry-actions-group">
            <button className="upload-btn secondary" onClick={handleRetry}>
              Try Again
            </button>
            <button className="upload-btn tertiary" onClick={handleReset}>
              Choose Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceUploader;
