export default function ConfirmDialog({ action, busy, onCancel, onConfirm }) {
  if (!action) return null;

  return (
    <div className="confirm-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M10.2 4.3 2.8 17.1A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.9L13.8 4.3a2.1 2.1 0 0 0-3.6 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="confirm-copy">
          <span className="eyebrow">Потвърждение</span>
          <h2 id="confirm-title">{action.title}</h2>
          <p>{action.message}</p>
          {action.detail && <strong>{action.detail}</strong>}
        </div>
        <div className="confirm-actions">
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={onCancel}>
            Отказ
          </button>
          <button className="btn btn-danger solid-danger" type="button" disabled={busy} onClick={onConfirm}>
            {busy ? (action.busyLabel || 'Изтриване...') : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
