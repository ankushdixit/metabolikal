/**
 * YouTube URL/ID utilities
 *
 * Extracts video IDs from various YouTube URL formats
 */

/**
 * Regular expression patterns for different YouTube URL formats
 */
const YOUTUBE_PATTERNS = [
  // Standard YouTube watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
  // Short URL: https://youtu.be/VIDEO_ID
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  // Shorts URL: https://youtube.com/shorts/VIDEO_ID
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  // Embed URL: https://www.youtube.com/embed/VIDEO_ID
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  // Direct video ID (11 characters, alphanumeric with dash/underscore)
  /^([a-zA-Z0-9_-]{11})$/,
];

/**
 * Extract YouTube video ID from a URL or direct ID
 *
 * Accepts:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - Just the VIDEO_ID directly
 *
 * @param input - YouTube URL or video ID
 * @returns The 11-character video ID, or null if invalid
 */
export function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate if a string is a valid YouTube video ID or URL
 *
 * @param input - YouTube URL or video ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidYouTubeInput(input: string): boolean {
  return extractYouTubeId(input) !== null;
}

/**
 * Get the thumbnail URL for a YouTube video
 *
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality (default, medium, high, maxres)
 * @returns Thumbnail URL
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: "default" | "mqdefault" | "hqdefault" | "maxresdefault" = "hqdefault"
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Get the embed URL for a YouTube video
 *
 * @param videoId - YouTube video ID
 * @returns Embed URL for iframe
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * Get the watch URL for a YouTube video
 *
 * @param videoId - YouTube video ID
 * @returns Standard watch URL
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
