"use client";

import { useState, useCallback } from "react";

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

interface UseModalReturn {
  activeModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  isOpen: (modal: ModalType) => boolean;
}

export function useModal(initialModal: ModalType = null): UseModalReturn {
  const [activeModal, setActiveModal] = useState<ModalType>(initialModal);

  const openModal = useCallback((modal: ModalType) => {
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const isOpen = useCallback((modal: ModalType) => activeModal === modal, [activeModal]);

  return {
    activeModal,
    openModal,
    closeModal,
    isOpen,
  };
}
