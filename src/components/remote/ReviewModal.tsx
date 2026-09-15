'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Check, X } from 'lucide-react';

export interface ReviewState {
  id: string;
  decision: 'Approved' | 'Rejected';
  comments: string;
}

interface ReviewModalProps {
  review: ReviewState | null;
  reviewError: string;
  onCommentsChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function ReviewModal({ review, reviewError, onCommentsChange, onClose, onSubmit }: ReviewModalProps) {
  return (
    <Modal isOpen={!!review} onClose={onClose} title={`${review?.decision} Remote Request`} size="sm">
      {review && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#263238] mb-1.5">
              {review.decision === 'Rejected' ? 'Rejection Reason' : 'Comments'}{' '}
              {review.decision === 'Rejected'
                ? <span className="font-normal text-red-500">(required)</span>
                : <span className="font-normal text-gray-400">(optional)</span>}
            </label>
            <textarea
              rows={3}
              value={review.comments}
              onChange={(e) => onCommentsChange(e.target.value)}
              placeholder={review.decision === 'Rejected' ? 'Please enter the reason for rejection...' : 'Reason for approval...'}
              className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:outline-none ${reviewError ? 'border-red-500 focus:border-red-500' : 'border-[#D6E4E8] focus:border-[#024fa7]'}`}
            />
            {reviewError && <p className="mt-1 text-sm text-red-500">{reviewError}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant={review.decision === 'Approved' ? 'primary' : 'danger'} onClick={onSubmit}>
              {review.decision === 'Approved' ? <><Check size={16} /> Approve</> : <><X size={16} /> Reject</>}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
