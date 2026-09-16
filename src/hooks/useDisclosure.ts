import { useCallback, useState } from 'react';

/**
 * Open/close/toggle state for modals, drawers and confirm dialogs.
 * Stable callbacks — safe to pass straight into `Modal onClose` etc.
 * Adoption is opt-in — no existing page was migrated to it.
 */

export interface Disclosure {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

/**
 * @example
 * const receipt = useDisclosure();
 * <Modal isOpen={receipt.isOpen} onClose={receipt.close} … />
 */
export function useDisclosure(initialOpen = false): Disclosure {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const setOpen = useCallback((v: boolean) => setIsOpen(v), []);

  return { isOpen, open, close, toggle, setOpen };
}
