import React from "react";
import { renderHook, act } from "@testing-library/react";
import {
  ModalProvider,
  useModalActions,
  useModalState,
  useModalContext,
  type ModalType,
} from "../modal-context";

// Wrapper component for hooks that need the provider
function wrapper({ children }: { children: React.ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

describe("modal-context", () => {
  describe("useModalActions", () => {
    it("throws when used outside ModalProvider", () => {
      // Suppress console.error for expected error
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useModalActions());
      }).toThrow("useModalActions must be used within a ModalProvider");

      consoleSpy.mockRestore();
    });

    it("provides openModal and closeModal functions", () => {
      const { result } = renderHook(() => useModalActions(), { wrapper });

      expect(typeof result.current.openModal).toBe("function");
      expect(typeof result.current.closeModal).toBe("function");
    });
  });

  describe("useModalState", () => {
    it("throws when used outside ModalProvider", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useModalState());
      }).toThrow("useModalState must be used within a ModalProvider");

      consoleSpy.mockRestore();
    });

    it("provides activeModal and isOpen", () => {
      const { result } = renderHook(() => useModalState(), { wrapper });

      expect(result.current.activeModal).toBeNull();
      expect(typeof result.current.isOpen).toBe("function");
    });

    it("activeModal starts as null", () => {
      const { result } = renderHook(() => useModalState(), { wrapper });

      expect(result.current.activeModal).toBeNull();
    });
  });

  describe("useModalContext (backward-compatible hook)", () => {
    it("throws when used outside ModalProvider (via useModalActions)", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useModalContext());
      }).toThrow("useModalActions must be used within a ModalProvider");

      consoleSpy.mockRestore();
    });

    it("provides combined actions and state", () => {
      const { result } = renderHook(() => useModalContext(), { wrapper });

      expect(typeof result.current.openModal).toBe("function");
      expect(typeof result.current.closeModal).toBe("function");
      expect(result.current.activeModal).toBeNull();
      expect(typeof result.current.isOpen).toBe("function");
    });
  });

  describe("isOpen function", () => {
    it("returns false when no modal is active", () => {
      const { result } = renderHook(() => useModalState(), { wrapper });

      expect(result.current.isOpen("calendly")).toBe(false);
      expect(result.current.isOpen("challenge-hub")).toBe(false);
      expect(result.current.isOpen(null)).toBe(true); // null === null
    });

    it("returns true only for the active modal", () => {
      const { result } = renderHook(() => useModalContext(), { wrapper });

      act(() => {
        result.current.openModal("calendly");
      });

      expect(result.current.isOpen("calendly")).toBe(true);
      expect(result.current.isOpen("challenge-hub")).toBe(false);
      expect(result.current.isOpen("login-required")).toBe(false);
      expect(result.current.isOpen(null)).toBe(false);
    });

    it("returns false for all modals after closeModal", () => {
      const { result } = renderHook(() => useModalContext(), { wrapper });

      act(() => {
        result.current.openModal("method");
      });

      expect(result.current.isOpen("method")).toBe(true);

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.isOpen("method")).toBe(false);
      expect(result.current.activeModal).toBeNull();
    });
  });

  describe("opening different modal types", () => {
    const modalTypes: ModalType[] = [
      "calendly",
      "real-results",
      "meet-expert",
      "method",
      "elite-programs",
      "body-fat-guide",
      "high-performer-trap",
      "elite-lifestyles",
      "assessment",
      "calculator",
      "results",
      "user-guide",
      "challenge-hub",
      "login-required",
      "profile-incomplete",
    ];

    it.each(modalTypes)("opens and tracks '%s' modal correctly", (modalType) => {
      const { result } = renderHook(() => useModalContext(), { wrapper });

      act(() => {
        result.current.openModal(modalType);
      });

      expect(result.current.activeModal).toBe(modalType);
      expect(result.current.isOpen(modalType)).toBe(true);
    });
  });

  describe("modal state transitions", () => {
    it("opening a new modal replaces the current one", () => {
      const { result } = renderHook(() => useModalContext(), { wrapper });

      act(() => {
        result.current.openModal("calendly");
      });

      expect(result.current.activeModal).toBe("calendly");

      act(() => {
        result.current.openModal("challenge-hub");
      });

      expect(result.current.activeModal).toBe("challenge-hub");
      expect(result.current.isOpen("calendly")).toBe(false);
      expect(result.current.isOpen("challenge-hub")).toBe(true);
    });

    it("closeModal resets activeModal to null", () => {
      const { result } = renderHook(() => useModalContext(), { wrapper });

      act(() => {
        result.current.openModal("assessment");
      });

      act(() => {
        result.current.closeModal();
      });

      expect(result.current.activeModal).toBeNull();
    });

    it("calling closeModal when no modal is open is a no-op", () => {
      const { result } = renderHook(() => useModalContext(), { wrapper });

      // Should not throw
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.activeModal).toBeNull();
    });

    it("opening null modal effectively closes all modals", () => {
      const { result } = renderHook(() => useModalContext(), { wrapper });

      act(() => {
        result.current.openModal("calendly");
      });

      act(() => {
        result.current.openModal(null);
      });

      expect(result.current.activeModal).toBeNull();
      expect(result.current.isOpen("calendly")).toBe(false);
    });
  });
});
