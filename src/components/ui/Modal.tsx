'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Portal target must wait for client mount (SSR has no document).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  // Portal to document.body: a `position: fixed` modal rendered inside a
  // transformed ancestor (e.g. a Card mid `translateY` hover lift) gets
  // re-contained by that ancestor per CSS spec, so the popup jumps/shifts
  // whenever hover state toggles under the cursor. Portaling detaches it
  // from every ancestor — it always centers on the true viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className={`relative w-full ${sizes[size]} bg-white rounded-xl shadow-xl transform transition-all max-h-[90vh] flex flex-col overflow-hidden`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6E4E8] shrink-0">
            <h3 className="text-lg font-semibold text-[#17324D]">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-[#EAF2F4]">
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-4 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
