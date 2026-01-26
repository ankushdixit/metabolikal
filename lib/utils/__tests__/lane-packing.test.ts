/**
 * Lane Packing Algorithm Tests
 */

import {
  packItemsIntoLanes,
  getLaneCount,
  groupByLane,
  doTimesOverlap,
  getMaxConcurrentItems,
  type LanePackingItem,
} from "../lane-packing";

describe("Lane Packing Algorithm", () => {
  describe("packItemsIntoLanes", () => {
    it("returns empty array for empty input", () => {
      const result = packItemsIntoLanes([]);
      expect(result).toEqual([]);
    });

    it("assigns single item to lane 0", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 540, type: "meal" },
      ];

      const result = packItemsIntoLanes(items);

      expect(result).toHaveLength(1);
      expect(result[0].lane).toBe(0);
    });

    it("assigns non-overlapping items to same lane", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 540, type: "meal" }, // 8-9 AM
        { id: "2", startMinutes: 600, endMinutes: 660, type: "meal" }, // 10-11 AM
        { id: "3", startMinutes: 720, endMinutes: 780, type: "meal" }, // 12-1 PM
      ];

      const result = packItemsIntoLanes(items);

      expect(result).toHaveLength(3);
      expect(result.every((item) => item.lane === 0)).toBe(true);
    });

    it("assigns overlapping items to different lanes", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 600, type: "meal" }, // 8-10 AM
        { id: "2", startMinutes: 540, endMinutes: 660, type: "supplement" }, // 9-11 AM
      ];

      const result = packItemsIntoLanes(items);

      expect(result).toHaveLength(2);
      expect(result[0].lane).toBe(0);
      expect(result[1].lane).toBe(1);
    });

    it("reuses lanes when items don't overlap", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 540, type: "meal" }, // 8-9 AM
        { id: "2", startMinutes: 480, endMinutes: 540, type: "supplement" }, // 8-9 AM (overlaps with 1)
        { id: "3", startMinutes: 600, endMinutes: 660, type: "meal" }, // 10-11 AM (can reuse lane 0)
      ];

      const result = packItemsIntoLanes(items);

      expect(result).toHaveLength(3);
      // Items 1 and 2 overlap, so they need different lanes
      // Item 3 can reuse lane 0 since it doesn't overlap with item 1
      const lanes = result.map((r) => r.lane);
      expect(new Set(lanes).size).toBe(2); // Only 2 lanes needed
    });

    it("handles items that touch at boundaries (no overlap)", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 540, type: "meal" }, // 8-9 AM
        { id: "2", startMinutes: 540, endMinutes: 600, type: "meal" }, // 9-10 AM (starts when 1 ends)
      ];

      const result = packItemsIntoLanes(items);

      expect(result).toHaveLength(2);
      // These should fit in the same lane since item 2 starts when item 1 ends
      expect(result.every((item) => item.lane === 0)).toBe(true);
    });

    it("handles multiple concurrent items", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 600, type: "meal" },
        { id: "2", startMinutes: 500, endMinutes: 620, type: "supplement" },
        { id: "3", startMinutes: 520, endMinutes: 640, type: "workout" },
        { id: "4", startMinutes: 540, endMinutes: 660, type: "lifestyle" },
      ];

      const result = packItemsIntoLanes(items);

      expect(result).toHaveLength(4);
      // All items overlap, so each needs its own lane
      const uniqueLanes = new Set(result.map((r) => r.lane));
      expect(uniqueLanes.size).toBe(4);
    });

    it("sorts items by start time for processing", () => {
      const items: LanePackingItem[] = [
        { id: "3", startMinutes: 720, endMinutes: 780, type: "meal" },
        { id: "1", startMinutes: 480, endMinutes: 540, type: "meal" },
        { id: "2", startMinutes: 600, endMinutes: 660, type: "meal" },
      ];

      const result = packItemsIntoLanes(items);

      // All should fit in lane 0 since they don't overlap
      expect(result.every((item) => item.lane === 0)).toBe(true);
    });

    it("prioritizes longer items when starting at same time", () => {
      const items: LanePackingItem[] = [
        { id: "short", startMinutes: 480, endMinutes: 510, type: "meal" }, // 30 min
        { id: "long", startMinutes: 480, endMinutes: 600, type: "lifestyle" }, // 120 min
      ];

      const result = packItemsIntoLanes(items);

      // Both overlap, need different lanes
      // The longer item should be processed first for better visual layout
      expect(result).toHaveLength(2);
      const longItem = result.find((r) => r.id === "long");
      const shortItem = result.find((r) => r.id === "short");
      expect(longItem?.lane).toBe(0); // Longer item gets lane 0
      expect(shortItem?.lane).toBe(1);
    });
  });

  describe("getLaneCount", () => {
    it("returns 1 for empty array", () => {
      expect(getLaneCount([])).toBe(1);
    });

    it("returns 1 for items all in lane 0", () => {
      const items = [
        { id: "1", startMinutes: 0, endMinutes: 60, type: "meal" as const, lane: 0 },
        { id: "2", startMinutes: 60, endMinutes: 120, type: "meal" as const, lane: 0 },
      ];
      expect(getLaneCount(items)).toBe(1);
    });

    it("returns correct count for multiple lanes", () => {
      const items = [
        { id: "1", startMinutes: 0, endMinutes: 60, type: "meal" as const, lane: 0 },
        { id: "2", startMinutes: 0, endMinutes: 60, type: "supplement" as const, lane: 1 },
        { id: "3", startMinutes: 0, endMinutes: 60, type: "workout" as const, lane: 2 },
      ];
      expect(getLaneCount(items)).toBe(3);
    });
  });

  describe("groupByLane", () => {
    it("returns empty map for empty array", () => {
      const result = groupByLane([]);
      expect(result.size).toBe(0);
    });

    it("groups items correctly", () => {
      const items = [
        { id: "1", startMinutes: 0, endMinutes: 60, type: "meal" as const, lane: 0 },
        { id: "2", startMinutes: 60, endMinutes: 120, type: "meal" as const, lane: 0 },
        { id: "3", startMinutes: 0, endMinutes: 60, type: "supplement" as const, lane: 1 },
      ];

      const result = groupByLane(items);

      expect(result.size).toBe(2);
      expect(result.get(0)?.length).toBe(2);
      expect(result.get(1)?.length).toBe(1);
    });
  });

  describe("doTimesOverlap", () => {
    it("detects overlapping times", () => {
      expect(doTimesOverlap(480, 540, 500, 600)).toBe(true);
    });

    it("detects non-overlapping times", () => {
      expect(doTimesOverlap(480, 540, 600, 660)).toBe(false);
    });

    it("treats touching boundaries as non-overlapping", () => {
      expect(doTimesOverlap(480, 540, 540, 600)).toBe(false);
    });

    it("handles contained ranges", () => {
      expect(doTimesOverlap(480, 600, 500, 550)).toBe(true);
    });

    it("is symmetric", () => {
      const result1 = doTimesOverlap(480, 540, 500, 600);
      const result2 = doTimesOverlap(500, 600, 480, 540);
      expect(result1).toBe(result2);
    });
  });

  describe("getMaxConcurrentItems", () => {
    it("returns 0 for empty array", () => {
      expect(getMaxConcurrentItems([])).toBe(0);
    });

    it("returns 1 for non-overlapping items", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 540, type: "meal" },
        { id: "2", startMinutes: 600, endMinutes: 660, type: "meal" },
      ];
      expect(getMaxConcurrentItems(items)).toBe(1);
    });

    it("returns correct count for overlapping items", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 600, type: "meal" },
        { id: "2", startMinutes: 500, endMinutes: 620, type: "supplement" },
        { id: "3", startMinutes: 520, endMinutes: 640, type: "workout" },
      ];
      expect(getMaxConcurrentItems(items)).toBe(3);
    });

    it("handles items that touch at boundaries", () => {
      const items: LanePackingItem[] = [
        { id: "1", startMinutes: 480, endMinutes: 540, type: "meal" },
        { id: "2", startMinutes: 540, endMinutes: 600, type: "meal" },
      ];
      expect(getMaxConcurrentItems(items)).toBe(1);
    });
  });
});
