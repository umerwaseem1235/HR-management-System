'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Trash2, XCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export type ConfirmVariant = 'approve' | 'reject' | 'delete' | 'warning' | 'info';

const VARIANT_STYLES: Record<
  ConfirmVariant,
  { card: string; iconBox: string; icon: React.ReactNode; confirmVariant: 'primary' | 'danger' }
> = {
  approve: {
    card: 'bg-green-50 border-green-200',
    iconBox: 'border-green-200',
    icon: <CheckCircle2 size={20} className="text-green-600" />,
    confirmVariant: 'primary',
  },
  reject: {
    card: 'bg-red-50 border-red-200',
    iconBox: 'border-red-200',
    icon: <XCircle size={20} className="text-red-600" />,
    confirmVariant: 'danger',
  },
  delete: {
    card: 'bg-gray-50 border-[#D6E4E8]',
    iconBox: 'border-[#D6E4E8]',
    icon: <Trash2 size={20} className="text-red-600" />,
    confirmVariant: 'danger',
  },
  warning: {
    card: 'bg-amber-50 border-amber-200',
    iconBox: 'border-amber-200',
    icon: <AlertTriangle size={20} className="text-amber-600" />,
    confirmVariant: 'danger',
  },
  info: {
    card: 'bg-blue-50 border-blue-200',
    iconBox: 'border-blue-200',
    icon: <Info size={20} className="text-[#024fa7]" />,
    confirmVariant: 'primary',
  },
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Modal heading, e.g. "Delete Expense?" */
  title: string;
  /** Color + icon treatment. Defaults to "delete". */
  variant?: ConfirmVariant;
  /** Override the default variant icon. */
  icon?: React.ReactNode;
  /** Primary summary line inside the tinted card. */
  headline: React.ReactNode;
  /** Secondary detail line inside the tinted card. */
  subline?: React.ReactNode;
  /** Explainer paragraph below the card. */
  note?: React.ReactNode;
  /** Extra content between the card and the actions (e.g. totals). */
  children?: React.ReactNode;
  /** Confirm button text, e.g. "Delete". */
  confirmLabel: string;
  /** Icon rendered before the confirm label. */
  confirmIcon?: React.ReactNode;
  onConfirm: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
}

/**
 * Shared confirmation dialog — one design language for every
 * approve / reject / delete / cancel confirmation in the app.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  title,
  variant = 'delete',
  icon,
  headline,
  subline,
  note,
  children,
  confirmLabel,
  confirmIcon,
  onConfirm,
  loading,
  confirmDisabled,
}: ConfirmDialogProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${styles.card}`}>
          <div className={`p-2 rounded-full bg-white border ${styles.iconBox}`}>
            {icon ?? styles.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">{headline}</p>
            {subline && <p className="text-xs text-gray-500 mt-1">{subline}</p>}
          </div>
        </div>
        {note && <p className="text-xs text-gray-500">{note}</p>}
        {children}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={styles.confirmVariant}
            onClick={onConfirm}
            loading={loading}
            disabled={confirmDisabled}
          >
            {confirmIcon} {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
