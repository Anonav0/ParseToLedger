import { useState, useRef } from "react";
import { uploadInvoice } from "../services/api";
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
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
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
    setError("");
    setResult(null);

    try {
      const data = await uploadInvoice(selectedFile);
      setResult(data);
      setUploadState("success");
    } catch (err) {
      setError(
        err.message || "Unable to process the invoice. Please try again.",
      );
      setUploadState("error");
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setUploadState("idle");
    setResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="uploader-card">
      <h2 className="uploader-title">Upload Invoice</h2>

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
            ? "Extracting invoice text…"
            : "Upload & Extract Text"}
        </button>
      )}

      {/* Success state */}
      {uploadState === "success" && result && (
        <div className="upload-result success">
          <p className="result-title">✓ {result.message}</p>
          <div className="result-details">
            <div className="result-row">
              <span className="result-label">File</span>
              <span className="result-value">{result.file?.originalName}</span>
            </div>
          </div>

          {result.text && (
            <div className="extracted-text-section">
              <h3 className="extracted-text-title">Invoice Text Extracted</h3>
              <pre className="extracted-text-content">{result.text}</pre>
            </div>
          )}

          <button className="upload-btn secondary" onClick={handleReset}>
            Upload Another Invoice
          </button>
        </div>
      )}

      {/* Error state */}
      {uploadState === "error" && error && (
        <div className="upload-result error">
          <p className="error-message">{error}</p>
          <button className="upload-btn secondary" onClick={handleReset}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

export default InvoiceUploader;
