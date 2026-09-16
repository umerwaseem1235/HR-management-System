'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { X } from 'lucide-react';
import type { RemoteRequest } from '../../lib/types';
import { formatRange } from './remote-utils';

interface DiscardConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DiscardConfirmModal({ isOpen, onClose, onConfirm }: DiscardConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Discard changes?" size="sm">
      <p className="text-sm text-gray-500">You have unsaved changes. Are you sure you want to cancel and discard this remote request?</p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>Keep Editing</Button>
        <Button variant="danger" onClick={onConfirm}>Discard</Button>
      </div>
    </Modal>
  );
}

interface CancelConfirmModalProps {
  cancelTarget: RemoteRequest | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function CancelConfirmModal({ cancelTarget, onClose, onConfirm }: CancelConfirmModalProps) {
  return (
    <Modal isOpen={!!cancelTarget} onClose={onClose} title="Cancel remote request?" size="sm">
      {cancelTarget && (
        <>
          <div className="rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] px-4 py-3">
            <p className="text-sm font-semibold text-[#17324D]">{formatRange(cancelTarget.fromDate, cancelTarget.toDate)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{cancelTarget.days} day{cancelTarget.days > 1 ? 's' : ''} · {cancelTarget.reason}</p>
          </div>
          <p className="text-sm text-gray-500 mt-3">This will mark the request as <span className="font-semibold text-[#263238]">Cancelled</span>. This action cannot be undone.</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>Keep Request</Button>
            <Button variant="danger" onClick={onConfirm}>
              <X size={16} /> Yes, Cancel
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
