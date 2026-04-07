export type HapticTone = "light" | "medium" | "success" | "error";

interface TriggerHapticOptions {
  enabled?: boolean;
  mobileOnly?: boolean;
}

const HAPTIC_PATTERNS: Record<HapticTone, number | number[]> = {
  light: 8,
  medium: 16,
  success: [10, 28, 10],
  error: [18, 42, 18],
};

function isLikelyMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (hasCoarsePointer) return true;

  const userAgent = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|mobile/.test(userAgent);
}

export function triggerHaptic(
  tone: HapticTone = "light",
  options: TriggerHapticOptions = {}
): void {
  const { enabled = true, mobileOnly = false } = options;
  if (!enabled) return;
  if (mobileOnly && !isLikelyMobileDevice()) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;

  try {
    navigator.vibrate(HAPTIC_PATTERNS[tone] ?? HAPTIC_PATTERNS.light);
  } catch {
    // Ignore unsupported or blocked vibration attempts.
  }
}
