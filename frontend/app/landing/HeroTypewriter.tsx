"use client";

import { useEffect, useMemo, useState } from "react";

interface HeroTypewriterProps {
  lines: string[];
}

export default function HeroTypewriter({ lines }: HeroTypewriterProps) {
  const normalizedLines = useMemo(
    () => lines.map((line) => line.trim()).filter((line) => line.length > 0),
    [lines]
  );
  const safeLines = normalizedLines.length > 0 ? normalizedLines : ["Build before you play."];

  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const activeLine = safeLines[lineIndex] ?? safeLines[0];
    const isLineComplete = charCount >= activeLine.length;
    const isLineEmpty = charCount <= 0;

    let delay = isMobile ? 78 : 54;
    if (!isDeleting && isLineComplete) {
      delay = isMobile ? 1500 : 1250;
    } else if (isDeleting && isLineEmpty) {
      delay = isMobile ? 360 : 280;
    } else if (isDeleting) {
      delay = isMobile ? 52 : 35;
    }

    const timeout = window.setTimeout(() => {
      if (!isDeleting && isLineComplete) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && isLineEmpty) {
        setIsDeleting(false);
        setLineIndex((prev) => (prev + 1) % safeLines.length);
        return;
      }

      setCharCount((prev) => prev + (isDeleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [charCount, isDeleting, isMobile, lineIndex, reducedMotion, safeLines]);

  useEffect(() => {
    const activeLength = (safeLines[lineIndex] ?? safeLines[0]).length;
    if (charCount > activeLength) {
      setCharCount(activeLength);
    }
  }, [charCount, lineIndex, safeLines]);

  useEffect(() => {
    if (lineIndex < safeLines.length) return;
    setLineIndex(0);
    setCharCount(0);
    setIsDeleting(false);
  }, [lineIndex, safeLines.length]);

  const activeLine = safeLines[lineIndex] ?? safeLines[0];
  const visibleText = reducedMotion ? activeLine : activeLine.slice(0, charCount);
  const fullTextLabel = safeLines.join(" ");
  const reserveLine = safeLines.reduce((longest, line) =>
    line.length > longest.length ? line : longest
  );

  return (
    <span className="landing-typewriter-wrap" aria-label={fullTextLabel}>
      <span className="landing-typewriter-reserve" aria-hidden="true">
        {reserveLine}
      </span>
      <span className="landing-typewriter" aria-hidden="true">
        <span>{visibleText}</span>
        {!reducedMotion && <span className="landing-typewriter-cursor" aria-hidden="true" />}
      </span>
    </span>
  );
}
