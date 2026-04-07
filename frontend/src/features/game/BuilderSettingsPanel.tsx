import { FiSettings } from "react-icons/fi";
import type { BuilderSettings, CardDensity, DexMode, DragBehavior } from "@/lib/types";

interface BuilderSettingsPanelProps {
  settings: BuilderSettings;
  onDexModeChange: (value: DexMode) => void;
  onVersionFilterDefaultChange: (value: boolean) => void;
  onCardDensityChange: (value: CardDensity) => void;
  onReduceMotionChange: (value: boolean) => void;
  onDragBehaviorChange: (value: DragBehavior) => void;
  onVersionThemingChange: (value: boolean) => void;
  onMobileHapticsChange: (value: boolean) => void;
  onReset: () => void;
}

const settingPill = "rounded-lg border px-2.5 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] transition-all";

const BuilderSettingsPanel = ({
  settings,
  onDexModeChange,
  onVersionFilterDefaultChange,
  onCardDensityChange,
  onReduceMotionChange,
  onDragBehaviorChange,
  onVersionThemingChange,
  onMobileHapticsChange,
  onReset,
}: BuilderSettingsPanelProps) => {
  return (
    <section className="panel p-4" aria-labelledby="builder-settings-heading">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 id="builder-settings-heading" className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
          <FiSettings size={14} className="mr-1.5 inline" style={{ verticalAlign: "-2px" }} />
          Builder Settings
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em]"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--surface-2)" }}
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <p className="mb-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
            Default Dex
          </p>
          <div className="inline-flex w-full rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            {(["regional", "national"] as const).map((mode) => {
              const isActive = settings.defaultDexMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onDexModeChange(mode)}
                  className="flex-1 rounded-lg px-2 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    background: isActive ? "var(--accent-soft)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    border: isActive ? "1px solid rgba(218, 44, 67, 0.34)" : "1px solid transparent",
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
            Default Version Filter
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className={settingPill}
              onClick={() => onVersionFilterDefaultChange(true)}
              style={{
                borderColor: settings.defaultVersionFilter ? "rgba(218, 44, 67, 0.34)" : "var(--border)",
                background: settings.defaultVersionFilter ? "var(--accent-soft)" : "var(--surface-2)",
                color: settings.defaultVersionFilter ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              On
            </button>
            <button
              type="button"
              className={settingPill}
              onClick={() => onVersionFilterDefaultChange(false)}
              style={{
                borderColor: !settings.defaultVersionFilter ? "rgba(218, 44, 67, 0.34)" : "var(--border)",
                background: !settings.defaultVersionFilter ? "var(--accent-soft)" : "var(--surface-2)",
                color: !settings.defaultVersionFilter ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              Off
            </button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
            Card Density
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(["compact", "comfortable"] as const).map((density) => {
              const isActive = settings.cardDensity === density;
              return (
                <button
                  key={density}
                  type="button"
                  className={settingPill}
                  onClick={() => onCardDensityChange(density)}
                  style={{
                    borderColor: isActive ? "rgba(218, 44, 67, 0.34)" : "var(--border)",
                    background: isActive ? "var(--accent-soft)" : "var(--surface-2)",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {density}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
            Drag Behavior
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { id: "auto", label: "Auto" },
              { id: "on", label: "Always" },
              { id: "off", label: "Off" },
            ] as const).map((option) => {
              const isActive = settings.dragBehavior === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={settingPill}
                  onClick={() => onDragBehaviorChange(option.id)}
                  style={{
                    borderColor: isActive ? "rgba(218, 44, 67, 0.34)" : "var(--border)",
                    background: isActive ? "var(--accent-soft)" : "var(--surface-2)",
                    color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <label
          className="inline-flex items-center justify-between gap-3 rounded-xl border px-3 py-2 md:hover:cursor-pointer"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <span>
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-secondary)" }}>
              Reduced Motion
            </span>
            <span className="text-[0.66rem]" style={{ color: "var(--text-muted)" }}>
              Tone down transitions and animations.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => onReduceMotionChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--accent)]"
            aria-label="Toggle reduced motion"
          />
        </label>

        <label
          className="inline-flex items-center justify-between gap-3 rounded-xl border px-3 py-2 md:hover:cursor-pointer"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <span>
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-secondary)" }}>
              Version Colors
            </span>
            <span className="text-[0.66rem]" style={{ color: "var(--text-muted)" }}>
              Tint UI with the selected game&apos;s color.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.versionTheming}
            onChange={(e) => onVersionThemingChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--accent)]"
            aria-label="Toggle version color theming"
          />
        </label>

        <label
          className="inline-flex items-center justify-between gap-3 rounded-xl border px-3 py-2 md:hover:cursor-pointer"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <span>
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-secondary)" }}>
              Mobile Haptics
            </span>
            <span className="text-[0.66rem]" style={{ color: "var(--text-muted)" }}>
              Vibrate on key actions when supported.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.mobileHaptics}
            onChange={(e) => onMobileHapticsChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-[var(--accent)]"
            aria-label="Toggle mobile haptics"
          />
        </label>
      </div>
    </section>
  );
};

export default BuilderSettingsPanel;
