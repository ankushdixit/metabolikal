import {
  extractYouTubeId,
  isValidYouTubeInput,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
  getYouTubeWatchUrl,
} from "../youtube";

describe("youtube utilities", () => {
  describe("extractYouTubeId", () => {
    describe("standard watch URLs", () => {
      it("extracts ID from standard watch URL", () => {
        expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });

      it("extracts ID from watch URL without www", () => {
        expect(extractYouTubeId("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });

      it("extracts ID from watch URL with http", () => {
        expect(extractYouTubeId("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });

      it("extracts ID from watch URL with additional parameters", () => {
        expect(
          extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLtest")
        ).toBe("dQw4w9WgXcQ");
      });

      it("extracts ID from watch URL with parameters before v", () => {
        expect(extractYouTubeId("https://www.youtube.com/watch?list=PLtest&v=dQw4w9WgXcQ")).toBe(
          "dQw4w9WgXcQ"
        );
      });
    });

    describe("short URLs (youtu.be)", () => {
      it("extracts ID from youtu.be URL", () => {
        expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });

      it("extracts ID from youtu.be URL with timestamp", () => {
        expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=120")).toBe("dQw4w9WgXcQ");
      });
    });

    describe("shorts URLs", () => {
      it("extracts ID from shorts URL", () => {
        expect(extractYouTubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });

      it("extracts ID from shorts URL with www", () => {
        expect(extractYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });
    });

    describe("embed URLs", () => {
      it("extracts ID from embed URL", () => {
        expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });

      it("extracts ID from embed URL without www", () => {
        expect(extractYouTubeId("https://youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });
    });

    describe("direct video IDs", () => {
      it("extracts a direct 11-character video ID", () => {
        expect(extractYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      });

      it("extracts ID with underscores and hyphens", () => {
        expect(extractYouTubeId("a_B-c1D2e3F")).toBe("a_B-c1D2e3F");
      });

      it("extracts a direct ID with leading/trailing whitespace", () => {
        expect(extractYouTubeId("  dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
      });
    });

    describe("invalid inputs", () => {
      it("returns null for empty string", () => {
        expect(extractYouTubeId("")).toBeNull();
      });

      it("returns null for null-ish values", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(extractYouTubeId(null as any)).toBeNull();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(extractYouTubeId(undefined as any)).toBeNull();
      });

      it("returns null for non-string input", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(extractYouTubeId(12345 as any)).toBeNull();
      });

      it("returns null for non-YouTube URLs", () => {
        expect(extractYouTubeId("https://www.vimeo.com/12345")).toBeNull();
        expect(extractYouTubeId("https://www.google.com")).toBeNull();
        expect(extractYouTubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
      });

      it("returns null for too-short IDs", () => {
        expect(extractYouTubeId("abc")).toBeNull();
      });

      it("returns null for too-long IDs", () => {
        expect(extractYouTubeId("abcdefghijkl")).toBeNull(); // 12 chars
      });

      it("returns null for IDs with invalid characters", () => {
        expect(extractYouTubeId("abc!@#$%^&*")).toBeNull();
      });

      it("returns null for whitespace-only input", () => {
        expect(extractYouTubeId("   ")).toBeNull();
      });

      it("returns null for malformed YouTube URLs with no ID", () => {
        expect(extractYouTubeId("https://www.youtube.com/watch?v=")).toBeNull();
        expect(extractYouTubeId("https://www.youtube.com/watch")).toBeNull();
      });
    });
  });

  describe("isValidYouTubeInput", () => {
    it("returns true for valid YouTube watch URL", () => {
      expect(isValidYouTubeInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    });

    it("returns true for valid youtu.be URL", () => {
      expect(isValidYouTubeInput("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    });

    it("returns true for valid shorts URL", () => {
      expect(isValidYouTubeInput("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(true);
    });

    it("returns true for valid embed URL", () => {
      expect(isValidYouTubeInput("https://youtube.com/embed/dQw4w9WgXcQ")).toBe(true);
    });

    it("returns true for direct video ID", () => {
      expect(isValidYouTubeInput("dQw4w9WgXcQ")).toBe(true);
    });

    it("returns false for empty string", () => {
      expect(isValidYouTubeInput("")).toBe(false);
    });

    it("returns false for non-YouTube URL", () => {
      expect(isValidYouTubeInput("https://www.vimeo.com/12345")).toBe(false);
    });

    it("returns false for random text", () => {
      expect(isValidYouTubeInput("not a youtube url")).toBe(false);
    });
  });

  describe("getYouTubeThumbnail", () => {
    const videoId = "dQw4w9WgXcQ";

    it("returns hqdefault thumbnail by default", () => {
      expect(getYouTubeThumbnail(videoId)).toBe(
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      );
    });

    it("returns default quality thumbnail", () => {
      expect(getYouTubeThumbnail(videoId, "default")).toBe(
        `https://img.youtube.com/vi/${videoId}/default.jpg`
      );
    });

    it("returns mqdefault quality thumbnail", () => {
      expect(getYouTubeThumbnail(videoId, "mqdefault")).toBe(
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      );
    });

    it("returns hqdefault quality thumbnail", () => {
      expect(getYouTubeThumbnail(videoId, "hqdefault")).toBe(
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      );
    });

    it("returns maxresdefault quality thumbnail", () => {
      expect(getYouTubeThumbnail(videoId, "maxresdefault")).toBe(
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      );
    });
  });

  describe("getYouTubeEmbedUrl", () => {
    it("returns the correct embed URL using youtube-nocookie domain", () => {
      expect(getYouTubeEmbedUrl("dQw4w9WgXcQ")).toBe(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
      );
    });

    it("constructs embed URL for any video ID", () => {
      expect(getYouTubeEmbedUrl("abc_DEF-123")).toBe(
        "https://www.youtube-nocookie.com/embed/abc_DEF-123"
      );
    });
  });

  describe("getYouTubeWatchUrl", () => {
    it("returns the correct standard watch URL", () => {
      expect(getYouTubeWatchUrl("dQw4w9WgXcQ")).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    });

    it("constructs watch URL for any video ID", () => {
      expect(getYouTubeWatchUrl("abc_DEF-123")).toBe("https://www.youtube.com/watch?v=abc_DEF-123");
    });
  });
});
