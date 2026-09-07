import { useState, useRef, useEffect } from "react";
import { uploadInvoice } from "../services/api";
import EmptyState from "./EmptyState";
import ProcessingSteps from "./ProcessingSteps";
import InvoiceResult from "./InvoiceResult";
import ErrorState from "./ErrorState";
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
  // 'EMPTY' | 'FILE_SELECTED' | 'PROCESSING' | 'SUCCESS' | 'ERROR'
  const [uiState, setUiState] = useState("EMPTY");
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentStage, setCurrentStage] = useState("uploading");
  const [failedStage, setFailedStage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  const replaceInputRef = useRef(null);
  const stageTimeoutsRef = useRef([]);

  function clearStageTimeouts() {
    stageTimeoutsRef.current.forEach(clearTimeout);
    stageTimeoutsRef.current = [];
  }

  useEffect(() => {
    return () => clearStageTimeouts();
  }, []);

  /**
   * Client-side validation before selecting/processing.
   */
  function validateFile(file) {
    if (!file) {
      return "Please select a PDF invoice.";
    }
    const isPdfType = file.type === "application/pdf";
    const hasPdfExt = file.name && file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfType && !hasPdfExt) {
      return "Only PDF files are allowed. Please select a valid PDF invoice.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB} MB (${formatFileSize(
        file.size,
      )}).`;
    }
    return null;
  }

  function handleFileSelected(file) {
    const valError = validateFile(file);
    if (valError) {
      setError(valError);
      setValidationErrors([]);
      setFailedStage("uploading");
      setUiState("ERROR");
      return;
    }

    clearStageTimeouts();
    setSelectedFile(file);
    setError("");
    setValidationErrors([]);
    setFailedStage(null);
    setResult(null);
    setUiState("FILE_SELECTED");
  }

  async function handleProcessInvoice(fileToProcess = selectedFile) {
    if (!fileToProcess) return;

    const valError = validateFile(fileToProcess);
    if (valError) {
      setError(valError);
      setValidationErrors([]);
      setFailedStage("uploading");
      setUiState("ERROR");
      return;
    }

    // Atomic reset before processing
    clearStageTimeouts();
    setError("");
    setValidationErrors([]);
    setFailedStage(null);
    setResult(null);
    setCurrentStage("uploading");
    setUiState("PROCESSING");

    // Advance stages through request lifecycle
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
      const data = await uploadInvoice(fileToProcess);
      clearStageTimeouts();
      setResult(data);
      setUiState("SUCCESS");
    } catch (err) {
      clearStageTimeouts();
      // Map failure stage based on error status if available
      let failedStageKey = currentStage;
      if (err.status === 400 || err.status === 413) {
        failedStageKey = "uploading";
      } else if (err.status === 422) {
        // Could be extraction (no text) or validation
        failedStageKey =
          err.errors && err.errors.length > 0 ? "validating" : "extracting";
      } else if (err.status === 502) {
        failedStageKey =
          currentStage === "syncing" ? "syncing" : "processing_ai";
      }

      setFailedStage(failedStageKey);
      setError(err.message || "We couldn't process this invoice.");
      if (Array.isArray(err.errors) && err.errors.length > 0) {
        setValidationErrors(err.errors);
      }
      setUiState("ERROR");
    }
  }

  function handleReset() {
    clearStageTimeouts();
    setSelectedFile(null);
    setCurrentStage("uploading");
    setFailedStage(null);
    setResult(null);
    setError("");
    setValidationErrors([]);
    setUiState("EMPTY");
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
    }
  }

  function handleRetry() {
    if (selectedFile) {
      handleProcessInvoice(selectedFile);
    } else {
      handleReset();
    }
  }

  return (
    <div className="dashboard-container">
      {/* 1. EMPTY STATE: Drag & Drop Dropzone */}
      {uiState === "EMPTY" && (
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Upload your invoice PDF</h2>
            <p className="card-subtitle">
              Upload a PDF invoice to extract its details and sync the result to
              Google Sheets.
            </p>
          </div>
          <EmptyState onFileSelected={handleFileSelected} />
        </div>
      )}

      {/* 2. FILE_SELECTED STATE: Selected File Card & Process Action */}
      {uiState === "FILE_SELECTED" && selectedFile && (
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Ready to Process</h2>
            <p className="card-subtitle">
              Review your selected invoice and click Process to begin
              extraction.
            </p>
          </div>

          <div className="file-preview-card">
            <div className="file-preview-left">
              <div className="pdf-icon-badge" aria-hidden="true">
                PDF
              </div>
              <div className="file-preview-meta">
                <span className="file-preview-name">{selectedFile.name}</span>
                <span className="file-preview-size">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="replace-file-btn"
              onClick={() => replaceInputRef.current?.click()}
            >
              Replace
            </button>
            <input
              ref={replaceInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden-file-input"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="upload-btn primary action-btn"
              onClick={() => handleProcessInvoice(selectedFile)}
            >
              Process Invoice
            </button>
            <button
              type="button"
              className="upload-btn tertiary"
              onClick={handleReset}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. PROCESSING STATE: Active Progress Tracker */}
      {uiState === "PROCESSING" && (
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Processing Invoice</h2>
            <p className="card-subtitle">
              {selectedFile?.name
                ? `Analyzing ${selectedFile.name}`
                : "Analyzing and synchronizing your invoice..."}
            </p>
          </div>

          <ProcessingSteps currentStage={currentStage} failedStage={null} />

          <button type="button" className="upload-btn primary" disabled>
            Processing...
          </button>
        </div>
      )}

      {/* 4. SUCCESS STATE: Invoice Result */}
      {uiState === "SUCCESS" && result?.invoice && (
        <InvoiceResult
          invoice={result.invoice}
          sync={result.sync}
          onReset={handleReset}
        />
      )}

      {/* Fallback raw text preview if structured invoice is missing */}
      {uiState === "SUCCESS" && !result?.invoice && result?.text && (
        <div className="dashboard-card success-raw">
          <h2 className="card-title">✓ {result.message}</h2>
          <pre className="extracted-text-content">{result.text}</pre>
          <button
            type="button"
            className="upload-btn secondary"
            onClick={handleReset}
          >
            Process Another Invoice
          </button>
        </div>
      )}

      {/* 5. ERROR STATE: Dedicated Error Presentation with Retry */}
      {uiState === "ERROR" && (
        <ErrorState
          message={error}
          validationErrors={validationErrors}
          failedStage={failedStage}
          onRetry={handleRetry}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default InvoiceUploader;
