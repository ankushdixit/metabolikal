/**
 * Lane Packing Algorithm
 *
 * Interval scheduling algorithm for assigning timeline items to lanes.
 * Minimizes the number of lanes needed while avoiding overlaps.
 */

import type { TimelineItemType } from "../database.types";

/**
 * Item with time range for lane packing
 */
export interface LanePackingItem {
  id: string;
  startMinutes: number; // Minutes from midnight
  endMinutes: number; // Minutes from midnight
  type: TimelineItemType;
}

/**
 * Item with assigned lane
 */
export interface PackedItem extends LanePackingItem {
  lane: number;
}

/**
 * Lane tracking during packing
 */
interface Lane {
  endTime: number;
}

/**
 * Interval scheduling algorithm for lane assignment.
 * Assigns items to minimum number of lanes while avoiding overlaps.
 *
 * Algorithm:
 * 1. Sort items by start time, then by duration (longer first for better packing)
 * 2. For each item, find the first lane where it fits (lane ends before item starts)
 * 3. If no lane fits, create a new lane
 * 4. Assign item to lane and update lane end time
 *
 * @param items - Items to pack into lanes
 * @returns Items with lane assignments
 */
export function packItemsIntoLanes(items: LanePackingItem[]): PackedItem[] {
  if (items.length === 0) {
    return [];
  }

  // Sort by start time, then by duration (longer first for better visual layout)
  const sorted = [...items].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    // Longer items first for better visual hierarchy
    return b.endMinutes - b.startMinutes - (a.endMinutes - a.startMinutes);
  });

  const lanes: Lane[] = [];
  const result: PackedItem[] = [];

  for (const item of sorted) {
    // Find first lane where item fits (lane ends before or when item starts)
    let assignedLane = lanes.findIndex((lane) => lane.endTime <= item.startMinutes);

    if (assignedLane === -1) {
      // No existing lane fits, create new lane
      assignedLane = lanes.length;
      lanes.push({ endTime: item.endMinutes });
    } else {
      // Update lane end time
      lanes[assignedLane].endTime = item.endMinutes;
    }

    result.push({ ...item, lane: assignedLane });
  }

  return result;
}

/**
 * Calculate total lanes needed for a set of packed items
 */
export function getLaneCount(packedItems: PackedItem[]): number {
  if (packedItems.length === 0) {
    return 1; // Minimum 1 lane for visual consistency
  }
  return Math.max(...packedItems.map((item) => item.lane)) + 1;
}

/**
 * Group packed items by lane for rendering
 */
export function groupByLane(packedItems: PackedItem[]): Map<number, PackedItem[]> {
  const lanes = new Map<number, PackedItem[]>();

  for (const item of packedItems) {
    const laneItems = lanes.get(item.lane) || [];
    laneItems.push(item);
    lanes.set(item.lane, laneItems);
  }

  return lanes;
}

/**
 * Check if two time ranges overlap
 */
export function doTimesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

/**
 * Get the maximum concurrent items at any point in time
 * Useful for determining if layout needs adjustment
 */
export function getMaxConcurrentItems(items: LanePackingItem[]): number {
  if (items.length === 0) return 0;

  // Create events for starts and ends
  const events: { time: number; isStart: boolean }[] = [];

  for (const item of items) {
    events.push({ time: item.startMinutes, isStart: true });
    events.push({ time: item.endMinutes, isStart: false });
  }

  // Sort by time, with ends before starts at same time
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.isStart ? 1 : -1; // Ends come before starts at same time
  });

  let current = 0;
  let max = 0;

  for (const event of events) {
    if (event.isStart) {
      current++;
      max = Math.max(max, current);
    } else {
      current--;
    }
  }

  return max;
}
