import { renderHook, act } from "@testing-library/react";
import { useModal, type ModalType } from "../use-modal";

describe("useModal", () => {
  it("initializes with null activeModal by default", () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.activeModal).toBeNull();
  });

  it("initializes with provided initial modal", () => {
    const { result } = renderHook(() => useModal("calendly"));
    expect(result.current.activeModal).toBe("calendly");
  });

  it("openModal sets the active modal", () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.openModal("calendly");
    });

    expect(result.current.activeModal).toBe("calendly");
  });

  it("closeModal sets activeModal to null", () => {
    const { result } = renderHook(() => useModal("calendly"));

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.activeModal).toBeNull();
  });

  it("isOpen returns true for active modal", () => {
    const { result } = renderHook(() => useModal("calendly"));

    expect(result.current.isOpen("calendly")).toBe(true);
    expect(result.current.isOpen("method")).toBe(false);
  });

  it("isOpen returns false when no modal is open", () => {
    const { result } = renderHook(() => useModal());

    expect(result.current.isOpen("calendly")).toBe(false);
    expect(result.current.isOpen("method")).toBe(false);
  });

  it("can switch between modals", () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.openModal("calendly");
    });
    expect(result.current.activeModal).toBe("calendly");

    act(() => {
      result.current.openModal("method");
    });
    expect(result.current.activeModal).toBe("method");
    expect(result.current.isOpen("calendly")).toBe(false);
    expect(result.current.isOpen("method")).toBe(true);
  });

  it("supports all modal types", () => {
    const modalTypes: ModalType[] = [
      "calendly",
      "real-results",
      "meet-expert",
      "method",
      "elite-programs",
      "body-fat-guide",
      "high-performer-trap",
      "elite-lifestyles",
    ];

    const { result } = renderHook(() => useModal());

    modalTypes.forEach((modalType) => {
      act(() => {
        result.current.openModal(modalType);
      });
      expect(result.current.activeModal).toBe(modalType);
      expect(result.current.isOpen(modalType)).toBe(true);
    });
  });
});
