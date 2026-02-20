"use client";

import { useCallback, useEffect, useState } from "react";
import { getBuilderSettingsStorageKey } from "@/lib/storageKeys";
import type { BuilderSettings, CardDensity, DexMode, DragBehavior } from "@/lib/types";

export const DEFAULT_BUILDER_SETTINGS: BuilderSettings = {
  defaultDexMode: "regional",
  defaultVersionFilter: true,
  cardDensity: "comfortable",
  reduceMotion: false,
  dragBehavior: "auto",
  versionTheming: true,
};

function isDexMode(value: unknown): value is DexMode {
  return value === "regional" || value === "national";
}

function isCardDensity(value: unknown): value is CardDensity {
  return value === "compact" || value === "comfortable";
}

function isDragBehavior(value: unknown): value is DragBehavior {
  return value === "auto" || value === "on" || value === "off";
}

function normalizeSettings(input: unknown): BuilderSettings {
  if (!input || typeof input !== "object") return DEFAULT_BUILDER_SETTINGS;
  const candidate = input as Partial<BuilderSettings>;

  return {
    defaultDexMode: isDexMode(candidate.defaultDexMode)
      ? candidate.defaultDexMode
      : DEFAULT_BUILDER_SETTINGS.defaultDexMode,
    defaultVersionFilter:
      typeof candidate.defaultVersionFilter === "boolean"
        ? candidate.defaultVersionFilter
        : DEFAULT_BUILDER_SETTINGS.defaultVersionFilter,
    cardDensity: isCardDensity(candidate.cardDensity)
      ? candidate.cardDensity
      : DEFAULT_BUILDER_SETTINGS.cardDensity,
    reduceMotion:
      typeof candidate.reduceMotion === "boolean"
        ? candidate.reduceMotion
        : DEFAULT_BUILDER_SETTINGS.reduceMotion,
    dragBehavior: isDragBehavior(candidate.dragBehavior)
      ? candidate.dragBehavior
      : DEFAULT_BUILDER_SETTINGS.dragBehavior,
    versionTheming:
      typeof candidate.versionTheming === "boolean"
        ? candidate.versionTheming
        : DEFAULT_BUILDER_SETTINGS.versionTheming,
  };
}

export function useBuilderSettings() {
  const [settings, setSettings] = useState<BuilderSettings>(DEFAULT_BUILDER_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getBuilderSettingsStorageKey());
      if (!raw) return;
      setSettings(normalizeSettings(JSON.parse(raw)));
    } catch {
      // ignore invalid persisted settings
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(getBuilderSettingsStorageKey(), JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [hydrated, settings]);

  useEffect(() => {
    document.documentElement.dataset.motion = settings.reduceMotion ? "reduced" : "default";
  }, [settings.reduceMotion]);

  const updateSetting = useCallback(<K extends keyof BuilderSettings>(key: K, value: BuilderSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_BUILDER_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
