import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Spinner } from './States';

/**
 * Accessible modal dialog: focus moves into the dialog, Tab is trapped, Escape closes,
 * background scroll is locked, and focus returns to the trigger on close.
 */
export function AccessibleModal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, select, button:not([data-close])');
      (first ?? ref.current)?.focus();
    }, 20);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            className={`relative max-h-[92vh] w-full ${width} overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-bold">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-ink-muted">
                    {description}
                  </p>
                )}
              </div>
              <button type="button" data-close onClick={onClose} className="btn-ghost btn-sm -mr-2 -mt-1 px-2" aria-label="Close dialog">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function ConfirmationDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
}) {
  return (
    <AccessibleModal open={open} onClose={onCancel} title={title} description={description} size="sm">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel} data-autofocus>
          Cancel
        </button>
        <button type="button" className={tone === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
          {loading && <Spinner />} {confirmLabel}
        </button>
      </div>
    </AccessibleModal>
  );
}
