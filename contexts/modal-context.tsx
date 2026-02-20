"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export type ModalType =
  | "calendly"
  | "real-results"
  | "meet-expert"
  | "method"
  | "elite-programs"
  | "body-fat-guide"
  | "high-performer-trap"
  | "elite-lifestyles"
  | "assessment"
  | "calculator"
  | "results"
  | "user-guide"
  | "challenge-hub"
  | "login-required"
  | "profile-incomplete"
  | null;

/* ── Context value types ───────────────────────────────────────────── */

interface ModalActionsContextType {
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
}

interface ModalStateContextType {
  activeModal: ModalType;
  isOpen: (modal: ModalType) => boolean;
}

/** Combined type for backward-compatibility with useModalContext(). */
type ModalContextType = ModalActionsContextType & ModalStateContextType;

/* ── Two separate contexts ─────────────────────────────────────────── */

const ModalActionsContext = createContext<ModalActionsContextType | undefined>(undefined);
const ModalStateContext = createContext<ModalStateContextType | undefined>(undefined);

/* ── Provider ──────────────────────────────────────────────────────── */

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Actions — stable references, never change
  const openModal = useCallback((modal: ModalType) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const actionsValue = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  // State — changes when a modal opens/closes
  const isOpen = useCallback((modal: ModalType) => activeModal === modal, [activeModal]);

  const stateValue = useMemo(() => ({ activeModal, isOpen }), [activeModal, isOpen]);

  return (
    <ModalActionsContext.Provider value={actionsValue}>
      <ModalStateContext.Provider value={stateValue}>{children}</ModalStateContext.Provider>
    </ModalActionsContext.Provider>
  );
}

/* ── Hooks ─────────────────────────────────────────────────────────── */

/** Use when you only need to open/close modals (trigger components).
 *  Will NOT re-render when modal state changes. */
export function useModalActions() {
  const context = useContext(ModalActionsContext);
  if (context === undefined) {
    throw new Error("useModalActions must be used within a ModalProvider");
  }
  return context;
}

/** Use when you need to know which modal is active (modal rendering components). */
export function useModalState() {
  const context = useContext(ModalStateContext);
  if (context === undefined) {
    throw new Error("useModalState must be used within a ModalProvider");
  }
  return context;
}

/** Backward-compatible hook — subscribes to BOTH contexts.
 *  Prefer useModalActions() for trigger components. */
export function useModalContext(): ModalContextType {
  const actions = useModalActions();
  const state = useModalState();
  return { ...actions, ...state };
}
