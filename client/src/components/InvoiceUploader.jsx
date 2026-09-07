import { useState, useRef } from "react";
import { uploadInvoice } from "../services/api";
import InvoiceResult from "./InvoiceResult";
import "./InvoiceUploader.css";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  const [uploadState, setUploadState] = useState("idle"); // 'idle' | 'uploading' | 'success' | 'error'
  const [loadingStage, setLoadingStage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const fileInputRef = useRef(null);

  /**
   * Client-side validation before upload.
   */
  function validateFile(file) {
    if (!file) {
      return "Please select a PDF invoice.";
    }
    if (file.type !== "application/pdf") {
      return "Only PDF files are allowed.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `The selected file is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
    }
    return null;
  }

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setSelectedFile(file);
    setUploadState("idle");
    setResult(null);
    setError("");
    setValidationErrors([]);
  }

  async function handleUpload() {
    // Client-side validation
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setLoadingStage("Analyzing and validating invoice…");
    setError("");
    setValidationErrors([]);
    setResult(null);

    try {
      const data = await uploadInvoice(selectedFile);
      setResult(data);
      setUploadState("success");
    } catch (err) {
      setError(
        err.message || "Unable to process the invoice. Please try again.",
      );
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        setValidationErrors(err.errors);
      }
      setUploadState("error");
    } finally {
      setLoadingStage("");
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setUploadState("idle");
    setLoadingStage("");
    setResult(null);
    setError("");
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="uploader-card">
      <h2 className="uploader-title">Process Invoice</h2>

      {/* File picker */}
      <div className="file-input-area">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={uploadState === "uploading"}
          id="invoice-file-input"
        />

        {selectedFile && uploadState !== "success" && (
          <div className="file-info">
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">
              {formatFileSize(selectedFile.size)}
            </span>
          </div>
        )}
      </div>

      {/* Upload button */}
      {uploadState !== "success" && (
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={!selectedFile || uploadState === "uploading"}
        >
          {uploadState === "uploading"
            ? loadingStage || "Processing invoice…"
            : "Upload & Process with AI"}
        </button>
      )}

      {/* Structured Invoice Result */}
      {uploadState === "success" && result?.invoice && (
        <InvoiceResult invoice={result.invoice} onReset={handleReset} />
      )}

      {/* Fallback Raw Text Result (if invoice object not present) */}
      {uploadState === "success" && !result?.invoice && result?.text && (
        <div className="upload-result success">
          <p className="result-title">✓ {result.message}</p>
          <div className="extracted-text-section">
            <h3 className="extracted-text-title">Invoice Text Extracted</h3>
            <pre className="extracted-text-content">{result.text}</pre>
          </div>
          <button className="upload-btn secondary" onClick={handleReset}>
            Upload Another Invoice
          </button>
        </div>
      )}

      {/* Error state */}
      {uploadState === "error" && error && (
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

          <button className="upload-btn secondary" onClick={handleReset}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default InvoiceUploader;
