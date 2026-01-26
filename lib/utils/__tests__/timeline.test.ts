/**
 * Tests for Timeline Utility Functions
 */

import {
  timeToMinutes,
  minutesToTime,
  formatTimeDisplay,
  getTimePeriodRange,
  getTimePeriodMidpoint,
  calculateRelativeTime,
  formatRelativeTimeDisplay,
  getEffectiveSortTime,
  sortTimelineItems,
  groupTimelineItemsByPeriod,
  getTimePeriodFromMinutes,
  getSchedulingDisplayText,
  formatTimePeriodDisplay,
  getTimePeriodIcon,
  validateScheduling,
  isTimeInPeriod,
  TIME_PERIOD_RANGES,
  DEFAULT_ANCHOR_TIMES,
} from "../timeline";
import type {
  TimelineScheduling,
  TimelineItem,
  ClientAnchorTimes,
  TimePeriod,
} from "../../database.types";

// =============================================================================
// TIME CONVERSION TESTS
// =============================================================================

describe("timeToMinutes", () => {
  it("converts midnight to 0", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("converts noon to 720", () => {
    expect(timeToMinutes("12:00")).toBe(720);
  });

  it("converts 23:59 to 1439", () => {
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("converts 08:30 to 510", () => {
    expect(timeToMinutes("08:30")).toBe(510);
  });

  it("handles single-digit hours and minutes", () => {
    expect(timeToMinutes("06:05")).toBe(365);
  });
});

describe("minutesToTime", () => {
  it("converts 0 to 00:00", () => {
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("converts 720 to 12:00", () => {
    expect(minutesToTime(720)).toBe("12:00");
  });

  it("converts 1439 to 23:59", () => {
    expect(minutesToTime(1439)).toBe("23:59");
  });

  it("converts 510 to 08:30", () => {
    expect(minutesToTime(510)).toBe("08:30");
  });

  it("clamps negative values to 00:00", () => {
    expect(minutesToTime(-30)).toBe("00:00");
  });

  it("clamps values >= 1440 to 23:59", () => {
    expect(minutesToTime(1500)).toBe("23:59");
  });
});

describe("formatTimeDisplay", () => {
  it("formats midnight as 12:00 AM", () => {
    expect(formatTimeDisplay("00:00")).toBe("12:00 AM");
  });

  it("formats noon as 12:00 PM", () => {
    expect(formatTimeDisplay("12:00")).toBe("12:00 PM");
  });

  it("formats 08:30 as 8:30 AM", () => {
    expect(formatTimeDisplay("08:30")).toBe("8:30 AM");
  });

  it("formats 20:45 as 8:45 PM", () => {
    expect(formatTimeDisplay("20:45")).toBe("8:45 PM");
  });

  it("formats 13:00 as 1:00 PM", () => {
    expect(formatTimeDisplay("13:00")).toBe("1:00 PM");
  });
});

// =============================================================================
// TIME PERIOD TESTS
// =============================================================================

describe("getTimePeriodRange", () => {
  it("returns correct range for morning", () => {
    const range = getTimePeriodRange("morning");
    expect(range).toEqual({ start: "07:00", end: "10:00" });
  });

  it("returns correct range for early_morning", () => {
    const range = getTimePeriodRange("early_morning");
    expect(range).toEqual({ start: "05:00", end: "07:00" });
  });

  it("returns correct range for before_sleep", () => {
    const range = getTimePeriodRange("before_sleep");
    expect(range).toEqual({ start: "22:00", end: "23:59" });
  });
});

describe("getTimePeriodMidpoint", () => {
  it("calculates midpoint for morning (08:30)", () => {
    // morning: 07:00 - 10:00, midpoint = 08:30
    expect(getTimePeriodMidpoint("morning")).toBe("08:30");
  });

  it("calculates midpoint for midday (12:00)", () => {
    // midday: 10:00 - 14:00, midpoint = 12:00
    expect(getTimePeriodMidpoint("midday")).toBe("12:00");
  });

  it("calculates midpoint for evening (18:30)", () => {
    // evening: 17:00 - 20:00, midpoint = 18:30
    expect(getTimePeriodMidpoint("evening")).toBe("18:30");
  });
});

describe("getTimePeriodFromMinutes", () => {
  it("categorizes 06:00 as early_morning", () => {
    expect(getTimePeriodFromMinutes(360)).toBe("early_morning");
  });

  it("categorizes 08:00 as morning", () => {
    expect(getTimePeriodFromMinutes(480)).toBe("morning");
  });

  it("categorizes 12:00 as midday", () => {
    expect(getTimePeriodFromMinutes(720)).toBe("midday");
  });

  it("categorizes 15:00 as afternoon", () => {
    expect(getTimePeriodFromMinutes(900)).toBe("afternoon");
  });

  it("categorizes 19:00 as evening", () => {
    expect(getTimePeriodFromMinutes(1140)).toBe("evening");
  });

  it("categorizes 21:00 as night", () => {
    expect(getTimePeriodFromMinutes(1260)).toBe("night");
  });

  it("categorizes 23:00 as before_sleep", () => {
    expect(getTimePeriodFromMinutes(1380)).toBe("before_sleep");
  });

  it("categorizes times before 05:00 as before_sleep", () => {
    expect(getTimePeriodFromMinutes(180)).toBe("before_sleep"); // 3:00 AM
  });
});

// =============================================================================
// RELATIVE TIME TESTS
// =============================================================================

describe("calculateRelativeTime", () => {
  const customAnchors: ClientAnchorTimes = {
    wake_up: "07:00",
    breakfast: "08:00",
    lunch: "12:30",
    evening_snack: "16:00",
    dinner: "19:00",
    sleep: "23:00",
    pre_workout: "17:00",
    post_workout: "18:30",
  };

  it("calculates time with positive offset", () => {
    // 30 minutes after breakfast (08:00) = 08:30
    expect(calculateRelativeTime("breakfast", 30, customAnchors)).toBe("08:30");
  });

  it("calculates time with negative offset", () => {
    // 15 minutes before workout (17:00) = 16:45
    expect(calculateRelativeTime("pre_workout", -15, customAnchors)).toBe("16:45");
  });

  it("calculates time with zero offset", () => {
    expect(calculateRelativeTime("lunch", 0, customAnchors)).toBe("12:30");
  });

  it("calculates time with hour+ offset", () => {
    // 90 minutes after dinner (19:00) = 20:30
    expect(calculateRelativeTime("dinner", 90, customAnchors)).toBe("20:30");
  });

  it("uses default anchors when custom not provided", () => {
    const result = calculateRelativeTime("breakfast", 30);
    // Default breakfast is 08:00, so +30 = 08:30
    expect(result).toBe("08:30");
  });
});

describe("formatRelativeTimeDisplay", () => {
  it("formats zero offset at anchor", () => {
    expect(formatRelativeTimeDisplay("breakfast", 0)).toBe("At breakfast");
  });

  it("formats pre_workout with zero offset", () => {
    expect(formatRelativeTimeDisplay("pre_workout", 0)).toBe("Before workout");
  });

  it("formats post_workout with zero offset", () => {
    expect(formatRelativeTimeDisplay("post_workout", 0)).toBe("After workout");
  });

  it("formats positive minutes offset", () => {
    expect(formatRelativeTimeDisplay("breakfast", 30)).toBe("30 min after breakfast");
  });

  it("formats negative minutes offset", () => {
    expect(formatRelativeTimeDisplay("lunch", -15)).toBe("15 min before lunch");
  });

  it("formats hour offset", () => {
    expect(formatRelativeTimeDisplay("dinner", 60)).toBe("1 hr after dinner");
  });

  it("formats hour and minutes offset", () => {
    expect(formatRelativeTimeDisplay("dinner", 90)).toBe("1 hr 30 min after dinner");
  });
});

// =============================================================================
// TIMELINE SORTING TESTS
// =============================================================================

describe("getEffectiveSortTime", () => {
  it("returns fixed time start in minutes", () => {
    const scheduling: TimelineScheduling = {
      time_type: "fixed",
      time_start: "08:30",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(getEffectiveSortTime(scheduling)).toBe(510);
  });

  it("returns period midpoint for period-based scheduling", () => {
    const scheduling: TimelineScheduling = {
      time_type: "period",
      time_start: null,
      time_end: null,
      time_period: "morning",
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    // Morning midpoint is 08:30 = 510 minutes
    expect(getEffectiveSortTime(scheduling)).toBe(510);
  });

  it("calculates relative time correctly", () => {
    const scheduling: TimelineScheduling = {
      time_type: "relative",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: "breakfast",
      relative_offset_minutes: 30,
    };
    // Default breakfast is 08:00 + 30 = 08:30 = 510 minutes
    expect(getEffectiveSortTime(scheduling)).toBe(510);
  });

  it("returns end of day for all_day items", () => {
    const scheduling: TimelineScheduling = {
      time_type: "all_day",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(getEffectiveSortTime(scheduling)).toBe(24 * 60);
  });
});

describe("sortTimelineItems", () => {
  const createItem = (id: string, scheduling: TimelineScheduling): TimelineItem => ({
    id,
    type: "meal",
    title: `Item ${id}`,
    scheduling,
  });

  it("sorts items by effective time", () => {
    const items: TimelineItem[] = [
      createItem("afternoon", {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "afternoon",
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
      createItem("morning", {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "morning",
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
      createItem("evening", {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "evening",
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
    ];

    const sorted = sortTimelineItems(items);
    expect(sorted.map((i) => i.id)).toEqual(["morning", "afternoon", "evening"]);
  });

  it("places all_day items at the end", () => {
    const items: TimelineItem[] = [
      createItem("all-day", {
        time_type: "all_day",
        time_start: null,
        time_end: null,
        time_period: null,
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
      createItem("morning", {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "morning",
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
    ];

    const sorted = sortTimelineItems(items);
    expect(sorted[sorted.length - 1].id).toBe("all-day");
  });

  it("mixes fixed and period-based items correctly", () => {
    const items: TimelineItem[] = [
      createItem("fixed-afternoon", {
        time_type: "fixed",
        time_start: "15:00",
        time_end: null,
        time_period: null,
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
      createItem("period-morning", {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "morning",
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
      createItem("fixed-early", {
        time_type: "fixed",
        time_start: "06:00",
        time_end: null,
        time_period: null,
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
    ];

    const sorted = sortTimelineItems(items);
    expect(sorted.map((i) => i.id)).toEqual(["fixed-early", "period-morning", "fixed-afternoon"]);
  });
});

describe("groupTimelineItemsByPeriod", () => {
  const createItem = (id: string, scheduling: TimelineScheduling): TimelineItem => ({
    id,
    type: "meal",
    title: `Item ${id}`,
    scheduling,
  });

  it("groups items by their time periods", () => {
    const items: TimelineItem[] = [
      createItem("morning-1", {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "morning",
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
      createItem("morning-2", {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "morning",
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
      createItem("evening-1", {
        time_type: "period",
        time_start: null,
        time_end: null,
        time_period: "evening",
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
    ];

    const groups = groupTimelineItemsByPeriod(items);
    expect(groups.get("morning")?.length).toBe(2);
    expect(groups.get("evening")?.length).toBe(1);
    expect(groups.get("afternoon")?.length).toBe(0);
  });

  it("groups all_day items separately", () => {
    const items: TimelineItem[] = [
      createItem("all-day-1", {
        time_type: "all_day",
        time_start: null,
        time_end: null,
        time_period: null,
        relative_anchor: null,
        relative_offset_minutes: 0,
      }),
    ];

    const groups = groupTimelineItemsByPeriod(items);
    expect(groups.get("all_day")?.length).toBe(1);
  });
});

// =============================================================================
// DISPLAY HELPER TESTS
// =============================================================================

describe("getSchedulingDisplayText", () => {
  it("displays fixed time", () => {
    const scheduling: TimelineScheduling = {
      time_type: "fixed",
      time_start: "08:30",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(getSchedulingDisplayText(scheduling)).toBe("8:30 AM");
  });

  it("displays relative time", () => {
    const scheduling: TimelineScheduling = {
      time_type: "relative",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: "breakfast",
      relative_offset_minutes: 30,
    };
    expect(getSchedulingDisplayText(scheduling)).toBe("30 min after breakfast");
  });

  it("displays period", () => {
    const scheduling: TimelineScheduling = {
      time_type: "period",
      time_start: null,
      time_end: null,
      time_period: "morning",
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(getSchedulingDisplayText(scheduling)).toBe("Morning");
  });

  it("displays all day", () => {
    const scheduling: TimelineScheduling = {
      time_type: "all_day",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(getSchedulingDisplayText(scheduling)).toBe("All Day");
  });
});

describe("formatTimePeriodDisplay", () => {
  it("formats early_morning", () => {
    expect(formatTimePeriodDisplay("early_morning")).toBe("Early Morning");
  });

  it("formats morning", () => {
    expect(formatTimePeriodDisplay("morning")).toBe("Morning");
  });

  it("formats before_sleep", () => {
    expect(formatTimePeriodDisplay("before_sleep")).toBe("Before Sleep");
  });
});

describe("getTimePeriodIcon", () => {
  it("returns sunrise for early_morning", () => {
    expect(getTimePeriodIcon("early_morning")).toBe("sunrise");
  });

  it("returns sun for morning", () => {
    expect(getTimePeriodIcon("morning")).toBe("sun");
  });

  it("returns moon for night", () => {
    expect(getTimePeriodIcon("night")).toBe("moon");
  });
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe("validateScheduling", () => {
  it("validates fixed scheduling with time_start", () => {
    const scheduling: TimelineScheduling = {
      time_type: "fixed",
      time_start: "08:30",
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(validateScheduling(scheduling)).toBe(true);
  });

  it("invalidates fixed scheduling without time_start", () => {
    const scheduling: TimelineScheduling = {
      time_type: "fixed",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(validateScheduling(scheduling)).toBe(false);
  });

  it("validates relative scheduling with anchor", () => {
    const scheduling: TimelineScheduling = {
      time_type: "relative",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: "breakfast",
      relative_offset_minutes: 30,
    };
    expect(validateScheduling(scheduling)).toBe(true);
  });

  it("invalidates relative scheduling without anchor", () => {
    const scheduling: TimelineScheduling = {
      time_type: "relative",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 30,
    };
    expect(validateScheduling(scheduling)).toBe(false);
  });

  it("validates period scheduling with time_period", () => {
    const scheduling: TimelineScheduling = {
      time_type: "period",
      time_start: null,
      time_end: null,
      time_period: "morning",
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(validateScheduling(scheduling)).toBe(true);
  });

  it("validates all_day scheduling always", () => {
    const scheduling: TimelineScheduling = {
      time_type: "all_day",
      time_start: null,
      time_end: null,
      time_period: null,
      relative_anchor: null,
      relative_offset_minutes: 0,
    };
    expect(validateScheduling(scheduling)).toBe(true);
  });
});

describe("isTimeInPeriod", () => {
  it("confirms 08:00 is in morning", () => {
    expect(isTimeInPeriod("08:00", "morning")).toBe(true);
  });

  it("confirms 07:00 is in morning (start boundary)", () => {
    expect(isTimeInPeriod("07:00", "morning")).toBe(true);
  });

  it("denies 10:00 is in morning (end boundary is exclusive)", () => {
    expect(isTimeInPeriod("10:00", "morning")).toBe(false);
  });

  it("confirms 12:00 is in midday", () => {
    expect(isTimeInPeriod("12:00", "midday")).toBe(true);
  });

  it("denies 08:00 is in midday", () => {
    expect(isTimeInPeriod("08:00", "midday")).toBe(false);
  });
});

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe("TIME_PERIOD_RANGES constant", () => {
  it("has all time periods defined", () => {
    const periods: TimePeriod[] = [
      "early_morning",
      "morning",
      "midday",
      "afternoon",
      "evening",
      "night",
      "before_sleep",
    ];
    periods.forEach((period) => {
      expect(TIME_PERIOD_RANGES[period]).toBeDefined();
      expect(TIME_PERIOD_RANGES[period].start).toBeDefined();
      expect(TIME_PERIOD_RANGES[period].end).toBeDefined();
    });
  });

  it("has contiguous time periods", () => {
    const orderedPeriods: TimePeriod[] = [
      "early_morning",
      "morning",
      "midday",
      "afternoon",
      "evening",
      "night",
      "before_sleep",
    ];

    for (let i = 0; i < orderedPeriods.length - 1; i++) {
      const currentEnd = TIME_PERIOD_RANGES[orderedPeriods[i]].end;
      const nextStart = TIME_PERIOD_RANGES[orderedPeriods[i + 1]].start;
      // The end of one period should match the start of the next
      expect(currentEnd).toBe(nextStart);
    }
  });
});

describe("DEFAULT_ANCHOR_TIMES constant", () => {
  it("has all required anchors defined", () => {
    expect(DEFAULT_ANCHOR_TIMES.wake_up).toBeDefined();
    expect(DEFAULT_ANCHOR_TIMES.breakfast).toBeDefined();
    expect(DEFAULT_ANCHOR_TIMES.lunch).toBeDefined();
    expect(DEFAULT_ANCHOR_TIMES.evening_snack).toBeDefined();
    expect(DEFAULT_ANCHOR_TIMES.dinner).toBeDefined();
    expect(DEFAULT_ANCHOR_TIMES.sleep).toBeDefined();
  });

  it("has anchors in chronological order", () => {
    const anchors = [
      DEFAULT_ANCHOR_TIMES.wake_up,
      DEFAULT_ANCHOR_TIMES.breakfast,
      DEFAULT_ANCHOR_TIMES.lunch,
      DEFAULT_ANCHOR_TIMES.evening_snack,
      DEFAULT_ANCHOR_TIMES.dinner,
      DEFAULT_ANCHOR_TIMES.sleep,
    ];

    for (let i = 0; i < anchors.length - 1; i++) {
      const current = timeToMinutes(anchors[i]);
      const next = timeToMinutes(anchors[i + 1]);
      expect(current).toBeLessThan(next);
    }
  });
});
