"use client";

type ReadStatusToastProps = {
  onUndo: () => void;
};

export function ReadStatusToast({ onUndo }: ReadStatusToastProps) {
  return (
    <div className="detail-toast" role="status" aria-live="polite">
      <div className="detail-toast-copy">
        <p className="detail-toast-label">Marked up to date</p>
      </div>

      <button type="button" onClick={onUndo} className="detail-toast-action">
        Undo
      </button>
    </div>
  );
}
