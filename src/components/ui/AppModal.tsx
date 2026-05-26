/**
 * AppModal — framer-motion powered modal shell.
 *
 * Replaces HeroUI's Modal/AlertDialog to give full control over animation and
 * responsive layout. Uses createPortal so it always renders at document.body
 * regardless of stacking context.
 *
 * Mobile  (< 680px): slides up from the bottom, rounded top corners.
 * Desktop (≥ 680px): spring pop-in at centre of screen.
 */

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { createContext, useContext, useEffect, useId, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useBreakpoint } from '../../utils/uiLayout';

// Tracks how many AppModal instances currently hold the body scroll lock.
let scrollLockCount = 0;

const ModalTitleIdContext = createContext<string | undefined>(undefined);

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Tailwind max-width class, e.g. "max-w-md". Ignored on mobile. */
  maxWidth?: string;
  /** Extra height class for desktop, e.g. "h-[80vh]". */
  heightClass?: string;
  /** Whether clicking the backdrop closes the modal. Default true. */
  isDismissable?: boolean;
  /** Show an explicit × close button in the top-right corner. */
  showClose?: boolean;
  children: React.ReactNode;
}

const SPRING = { type: 'spring' as const, stiffness: 480, damping: 38, mass: 0.75 };
const EASE   = { duration: 0.18, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

export function AppModal({
  isOpen,
  onClose,
  maxWidth = 'max-w-lg',
  heightClass,
  isDismissable = true,
  showClose = false,
  children,
}: AppModalProps) {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile';
  const titleId = useId();

  // Trap Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open — ref-counted so multiple modals don't race.
  useEffect(() => {
    if (!isOpen) return;
    if (++scrollLockCount === 1) document.body.style.overflow = 'hidden';
    return () => {
      if (--scrollLockCount === 0) document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-focus first focusable element
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  const mobileVariants = {
    hidden: { y: '100%', opacity: 1 },
    visible: { y: 0, opacity: 1, transition: SPRING },
    exit: { y: '100%', opacity: 1, transition: EASE },
  };

  const desktopVariants = {
    hidden: { scale: 0.94, opacity: 0, y: 16 },
    visible: { scale: 1, opacity: 1, y: 0, transition: SPRING },
    exit: { scale: 0.94, opacity: 0, y: 8, transition: EASE },
  };

  const variants = isMobile ? mobileVariants : desktopVariants;

  const dialogClasses = isMobile
    ? `relative z-10 w-full bg-neutral-900 border-t border-white/15
       rounded-t-2xl flex flex-col max-h-[88vh] overflow-hidden`
    : `relative z-10 w-full ${maxWidth} ${heightClass ?? ''} bg-neutral-900
       border border-white/15 rounded-2xl flex flex-col overflow-hidden
       mx-4`;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-[500] flex ${isMobile ? 'items-end' : 'items-center'} justify-center`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={isDismissable ? onClose : undefined}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            className={dialogClasses}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {showClose && (
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 z-10 p-1 rounded text-white/40
                           hover:text-white/80 hover:bg-white/8 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
            <ModalTitleIdContext.Provider value={titleId}>
              {children}
            </ModalTitleIdContext.Provider>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Composable sub-sections ─────────────────────────────────────────────── */

export function ModalHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 px-6 py-4 border-b border-white/10 shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function ModalIcon({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function ModalTitle({ children }: { children: React.ReactNode }) {
  const id = useContext(ModalTitleIdContext);
  return <h2 id={id} className="text-sm font-semibold text-white">{children}</h2>;
}

export function ModalBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex-1 overflow-y-auto min-h-0 px-6 py-4 ${className}`} style={{ scrollbarWidth: 'thin' }}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10 shrink-0 flex-wrap ${className}`}>
      {children}
    </div>
  );
}
