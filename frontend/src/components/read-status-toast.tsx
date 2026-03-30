"use client";

type ReadStatusToastProps = {
  visible: boolean;
  onUndo: () => void;
};

export function ReadStatusToast({ visible, onUndo }: ReadStatusToastProps) {
  return (
    <div
      className={`detail-toast${visible ? " detail-toast--visible" : " detail-toast--hidden"}`}
      role="status"
      aria-live="polite"
    >
      <div className="detail-toast-copy">
        <p className="detail-toast-label">Marked up to date</p>
      </div>

      <button type="button" onClick={onUndo} className="detail-toast-action">
        Undo
      </button>
    </div>
  );
}
