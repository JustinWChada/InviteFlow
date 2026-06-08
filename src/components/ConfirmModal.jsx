import React, { useEffect, useRef } from 'react';

export default function ConfirmModal({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  const confirmRef = useRef(null);
  const overlayRef = useRef(null);
  const previousActiveRef = useRef(null);

  useEffect(() => {
    if (open && confirmRef.current) {
      // Focus the confirm button when modal opens for accessibility
      previousActiveRef.current = document.activeElement;
      confirmRef.current.focus();
      const onKey = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel && onCancel();
        }
        if (e.key === 'Tab') {
          // simple focus trap: keep focus within the modal
          const focusable = overlayRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', onKey);

      return () => {
        document.removeEventListener('keydown', onKey);
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div ref={overlayRef} className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal card">
        {title && <h3>{title}</h3>}
        {message && <p className="muted">{message}</p>}

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button ref={confirmRef} className="btn" onClick={onConfirm}>{confirmText}</button>
          <button className="btn btn-outline" onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
}
