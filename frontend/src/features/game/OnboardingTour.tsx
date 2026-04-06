"use client";

import { useCallback, useEffect, useState } from "react";

const TOUR_KEY_BASE = "poke-builder:tour-completed";

function getTourKey(userId?: string | null) {
  return userId ? `${TOUR_KEY_BASE}:${userId}` : TOUR_KEY_BASE;
}

function isTourCompleted(userId?: string | null): boolean {
  try {
    // Check user-specific key first
    if (userId && localStorage.getItem(getTourKey(userId))) return true;
    // Also check the legacy anonymous key
    if (localStorage.getItem(TOUR_KEY_BASE)) {
      // Migrate: if user is signed in but only the anonymous flag exists, copy it
      if (userId) localStorage.setItem(getTourKey(userId), "1");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function markTourCompleted(userId?: string | null) {
  try {
    localStorage.setItem(getTourKey(userId), "1");
    // Also set anonymous key so it persists if they sign out
    if (userId) localStorage.setItem(TOUR_KEY_BASE, "1");
  } catch { /* noop */ }
}

const MOBILE_BREAKPOINT = 768;

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "#available-pokemon-heading",
    title: "Browse & Search Pokémon",
    description: "Search by name, filter by type, or switch between regional and national Pokédex modes.",
    position: "bottom",
  },
  {
    target: "[data-tour='team-panel']",
    title: "Build Your Team",
    description: "Tap or drag Pokémon to fill your 6 team slots. Rearrange by dragging between slots.",
    position: "left",
  },
  {
    target: "[data-tour='ai-coach']",
    title: "AI Coach",
    description: "Get smart team analysis, weakness coverage advice, and Pokémon recommendations.",
    position: "left",
  },
  {
    target: "[data-tour='team-tools']",
    title: "Team Tools",
    description: "Save your team, share via link, export as image, and manage saved teams.",
    position: "bottom",
  },
];

interface OnboardingTourProps {
  enabled?: boolean;
  userId?: string | null;
}

const OnboardingTour = ({ enabled = true, userId }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (isTourCompleted(userId)) return;
    const timer = setTimeout(() => setCurrentStep(0), 1200);
    return () => clearTimeout(timer);
  }, [enabled, userId]);

  const updateSpotlight = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) return;
    const step = TOUR_STEPS[stepIndex];
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setSpotlightRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setSpotlightRect(null);
    }
  }, []);

  useEffect(() => {
    updateSpotlight(currentStep);
  }, [currentStep, updateSpotlight]);

  // Update position on scroll/resize
  useEffect(() => {
    if (currentStep < 0) return;
    const update = () => updateSpotlight(currentStep);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [currentStep, updateSpotlight]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCurrentStep(-1);
      markTourCompleted(userId);
    }
  }, [currentStep, userId]);

  const handleSkip = useCallback(() => {
    setCurrentStep(-1);
    markTourCompleted(userId);
  }, [userId]);

  if (currentStep < 0 || currentStep >= TOUR_STEPS.length) return null;

  const step = TOUR_STEPS[currentStep];
  const pad = 8;
  const isMobile = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
  // On mobile, force left/right positions to bottom to prevent off-screen clipping
  const effectivePosition = isMobile && (step.position === "left" || step.position === "right")
    ? "bottom"
    : step.position;

  const tooltipStyle: React.CSSProperties = {};
  if (spotlightRect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipW = Math.min(300, vw - 32);
    const maxLeft = Math.max(16, vw - tooltipW - 16);

    if (effectivePosition === "bottom") {
      const rawTop = spotlightRect.bottom + pad + 12;
      tooltipStyle.top = Math.min(rawTop, vh - 180);
      tooltipStyle.left = Math.min(maxLeft, Math.max(16, spotlightRect.left + spotlightRect.width / 2 - tooltipW / 2));
    } else if (effectivePosition === "top") {
      tooltipStyle.bottom = vh - spotlightRect.top + pad + 12;
      tooltipStyle.left = Math.min(maxLeft, Math.max(16, spotlightRect.left + spotlightRect.width / 2 - tooltipW / 2));
    } else if (effectivePosition === "left") {
      tooltipStyle.top = Math.max(16, Math.min(spotlightRect.top + spotlightRect.height / 2 - 40, vh - 180));
      tooltipStyle.right = vw - spotlightRect.left + pad + 12;
    } else {
      tooltipStyle.top = Math.max(16, Math.min(spotlightRect.top + spotlightRect.height / 2 - 40, vh - 180));
      tooltipStyle.left = Math.min(maxLeft, spotlightRect.right + pad + 12);
    }
  } else {
    tooltipStyle.top = "40%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <div className="tour-overlay" aria-live="polite">
      {/* Spotlight cutout via SVG */}
      <svg className="tour-svg" width="100%" height="100%">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - pad}
                y={spotlightRect.top - pad}
                width={spotlightRect.width + pad * 2}
                height={spotlightRect.height + pad * 2}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight border ring */}
      {spotlightRect && (
        <div
          className="tour-spotlight-ring"
          style={{
            top: spotlightRect.top - pad,
            left: spotlightRect.left - pad,
            width: spotlightRect.width + pad * 2,
            height: spotlightRect.height + pad * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-tooltip-step">
          {currentStep + 1} of {TOUR_STEPS.length}
        </div>
        <h3 className="tour-tooltip-title">{step.title}</h3>
        <p className="tour-tooltip-desc">{step.description}</p>
        <div className="tour-tooltip-actions">
          <button type="button" onClick={handleSkip} className="tour-tooltip-skip">
            Skip tour
          </button>
          <button type="button" onClick={handleNext} className="tour-tooltip-next">
            {currentStep === TOUR_STEPS.length - 1 ? "Got it!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
