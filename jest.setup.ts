/* eslint-disable no-undef */
import "@testing-library/jest-dom";

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock PointerEvent for Radix UI Slider
// Only define if MouseEvent exists (JSDOM environment)
if (typeof MouseEvent !== "undefined" && !global.PointerEvent) {
  class MockPointerEvent extends MouseEvent {
    public pointerId: number = 0;
    public width: number = 0;
    public height: number = 0;
    public pressure: number = 0;
    public tangentialPressure: number = 0;
    public tiltX: number = 0;
    public tiltY: number = 0;
    public twist: number = 0;
    public pointerType: string = "";
    public isPrimary: boolean = false;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId || 0;
    }

    getCoalescedEvents(): PointerEvent[] {
      return [];
    }

    getPredictedEvents(): PointerEvent[] {
      return [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.PointerEvent = MockPointerEvent as any;
}

// Mock scrollIntoView for Radix UI Select
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = jest.fn();

  // Mock hasPointerCapture for Radix UI Slider
  Element.prototype.hasPointerCapture = jest.fn().mockReturnValue(false);
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
}
