import { useState, useRef } from "react";

function EmptyState({ onFileSelected, disabled = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
    }
  }

  function handleInputChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected(file);
    }
  }

  function handleDropzoneClick() {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleDropzoneClick();
    }
  }

  return (
    <div
      className={`dropzone-container ${isDragOver ? "drag-active" : ""} ${
        disabled ? "disabled" : ""
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleDropzoneClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload invoice PDF by dropping file or clicking to browse"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden-file-input"
        id="invoice-dropzone-input"
        tabIndex={-1}
      />

      <div className="dropzone-content">
        <div className="dropzone-icon" aria-hidden="true">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="12" y2="12" />
            <line x1="15" y1="15" x2="12" y2="12" />
          </svg>
        </div>

        <p className="dropzone-primary-text">
          {isDragOver
            ? "Release to drop invoice PDF"
            : "Drop your invoice PDF here"}
        </p>

        <span className="dropzone-divider">or</span>

        <button
          type="button"
          className="browse-btn"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            handleDropzoneClick();
          }}
        >
          Browse Files
        </button>

        <span className="dropzone-format-hint">PDF • Max 10 MB</span>
      </div>
    </div>
  );
}

export default EmptyState;
