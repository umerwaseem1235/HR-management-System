'use client';

import { Paperclip, Send, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

interface ExpenseModalProps {
  isOpen: boolean;
  editingId: string | null;
  category: string;
  onCategoryChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  date: string;
  onDateChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  errors: Record<string, string>;
  submitting: boolean;
  fileKey: number;
  receiptName: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ExpenseModal({
  isOpen, editingId, category, onCategoryChange, amount, onAmountChange,
  date, onDateChange, description, onDescriptionChange, errors, submitting,
  fileKey, receiptName, onFileChange, onRemoveFile, onClose, onSubmit,
}: ExpenseModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Edit Expense Claim' : 'New Expense Claim'}>
      <form onSubmit={onSubmit} className="space-y-5">
        <Select
          label="Category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          error={errors.category}
          options={[{ value: '', label: 'Select Category' }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Amount ($)" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => onAmountChange(e.target.value)} error={errors.amount} />
          <Input label="Date" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} error={errors.date} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="What was this expense for?"
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:ring-2 focus:outline-none ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#D6E4E8] focus:border-[#024fa7] focus:ring-[#024fa7]/20'}`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Payslip / Receipt (optional)</label>
          <input
            key={fileKey}
            type="file"
            accept="image/*,.pdf"
            onChange={onFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#EAF2F4] file:text-[#17324D] hover:file:bg-[#D6E4E8]"
          />
          {errors.receipt && <p className="mt-1 text-sm text-red-500">{errors.receipt}</p>}
          {receiptName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-[#263238] bg-[#EAF2F4]/60 border border-[#D6E4E8] rounded-lg px-3 py-2">
              <Paperclip size={14} className="text-[#024fa7] flex-shrink-0" />
              <span className="truncate flex-1">{receiptName}</span>
              <button
                type="button"
                title="Remove file"
                onClick={onRemoveFile}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">Your claim will be submitted with <span className="font-medium">Pending</span> status until it is approved or rejected.</p>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            <Send size={16} /> {submitting ? (editingId ? 'Saving...' : 'Submitting...') : (editingId ? 'Save Changes' : 'Submit Claim')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
