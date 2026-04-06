"use client";

import { FiBookOpen, FiEdit3, FiFolder } from "react-icons/fi";

export type OpponentSourceMode = "preset" | "manual" | "saved";

interface OpponentSourceSwitchProps {
  value: OpponentSourceMode;
  onChange: (mode: OpponentSourceMode) => void;
  isAuthenticated: boolean;
}

const MODES: { id: OpponentSourceMode; label: string; icon: React.ReactNode }[] = [
  { id: "preset",  label: "Preset",  icon: <FiBookOpen size={12} /> },
  { id: "manual",  label: "Manual",  icon: <FiEdit3 size={12} /> },
  { id: "saved",   label: "Saved",   icon: <FiFolder size={12} /> },
];

export default function OpponentSourceSwitch({
  value,
  onChange,
  isAuthenticated,
}: OpponentSourceSwitchProps) {
  return (
    <div
      className="inline-flex rounded-xl border p-1"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      role="tablist"
      aria-label="Opponent source"
    >
      {MODES.map((mode) => {
        const isActive = value === mode.id;
        const disabled = mode.id === "saved" && !isAuthenticated;

        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => !disabled && onChange(mode.id)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.78rem] font-semibold transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: isActive ? "var(--version-color-soft, var(--accent-soft))" : "transparent",
              border: isActive ? "1px solid var(--version-color-border, rgba(218, 44, 67, 0.34))" : "1px solid transparent",
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
            }}
            title={disabled ? "Sign in to access saved opponent teams" : undefined}
          >
            {mode.icon}
            <span className="hidden sm:inline">{mode.label}</span>
            <span className="sm:hidden">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
