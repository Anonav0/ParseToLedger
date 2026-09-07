const STAGES = [
  { key: "uploading", label: "Upload", description: "Uploading invoice..." },
  {
    key: "extracting",
    label: "Extract",
    description: "Extracting invoice text...",
  },
  {
    key: "processing_ai",
    label: "Analyze",
    description: "Analyzing invoice...",
  },
  {
    key: "validating",
    label: "Validate",
    description: "Validating invoice data...",
  },
  {
    key: "syncing",
    label: "Sync",
    description: "Syncing with Google Sheets...",
  },
];

function ProcessingSteps({ currentStage = "uploading", failedStage = null }) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);
  const failedIdx = failedStage
    ? STAGES.findIndex((s) => s.key === failedStage)
    : -1;
  const activeDesc = STAGES[currentIdx]?.description || "Processing invoice...";

  return (
    <div
      className="processing-steps-container"
      role="status"
      aria-live="polite"
    >
      <div className="processing-current-status">
        <span className="processing-spinner" aria-hidden="true" />
        <span className="processing-status-text">{activeDesc}</span>
      </div>

      <div className="stepped-tracker">
        {STAGES.map((stage, idx) => {
          const isFailed = failedIdx === idx;
          const isDone =
            failedIdx === -1
              ? currentIdx > idx
              : currentIdx > idx && idx < failedIdx;
          const isActive = failedIdx === -1 && currentIdx === idx;

          let stepClass = "step-item";
          if (isFailed) stepClass += " step-failed";
          else if (isDone) stepClass += " step-done";
          else if (isActive) stepClass += " step-active";
          else stepClass += " step-inactive";

          return (
            <div key={stage.key} className={stepClass}>
              <div className="step-circle" aria-hidden="true">
                {isFailed ? "✕" : isDone ? "✓" : isActive ? "●" : idx + 1}
              </div>
              <span className="step-label">{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProcessingSteps;
