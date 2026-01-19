"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ModalType =
  | "calendly"
  | "real-results"
  | "meet-expert"
  | "method"
  | "elite-programs"
  | "body-fat-guide"
  | "high-performer-trap"
  | "elite-lifestyles"
  | null;

interface ModalContextType {
  activeModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  isOpen: (modal: ModalType) => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const openModal = useCallback((modal: ModalType) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const isOpen = useCallback((modal: ModalType) => activeModal === modal, [activeModal]);

  return (
    <ModalContext.Provider value={{ activeModal, openModal, closeModal, isOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalContext() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModalContext must be used within a ModalProvider");
  }
  return context;
}
