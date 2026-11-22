import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({ open, onOpenChange, title, description, header, footer, children }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-in fixed inset-0 z-40 bg-[rgb(17_22_20/0.42)]" />
        <Dialog.Content className="animate-drawer-in fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-surface shadow-panel focus:outline-none">
          {header}
          <div className={`flex items-start justify-between gap-4 px-6 ${header ? 'pt-5' : 'border-b border-rule py-4'}`}>
            <div className="min-w-0">
              <Dialog.Title className={header ? 'sr-only' : 'text-lg font-semibold'}>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-ink-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            {!header && (
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" aria-label="Close" className="-mr-2 h-9 w-9 px-0">
                  <X size={18} />
                </Button>
              </Dialog.Close>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-rule bg-surface px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({ open, onOpenChange, title, body, confirmLabel, cancelLabel = 'Cancel', onConfirm, loading }: ConfirmProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-in fixed inset-0 z-[60] bg-[rgb(17_22_20/0.42)]" />
        <Dialog.Content className="animate-pop-in fixed left-1/2 top-1/2 z-[70] w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-panel bg-surface p-6 shadow-panel focus:outline-none">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          <Dialog.Description asChild>
            <div className="mt-2 text-sm text-ink-muted">{body}</div>
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary">{cancelLabel}</Button>
            </Dialog.Close>
            <Button variant="danger" onClick={onConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
