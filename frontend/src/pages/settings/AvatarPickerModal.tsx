import { useEffect, useMemo, useState } from "react";
import Image from "~/components/ui/AppImage";
import { FiCheck, FiImage, FiX } from "react-icons/fi";
import {
  AVATAR_FRAME_OPTIONS,
  AVATAR_PRESETS,
  getAvatarFrameStyles,
  type AvatarFrameKey,
} from "@/lib/profile";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { safeImageSrc } from "@/lib/image";

interface AvatarPickerModalProps {
  isOpen: boolean;
  selectedAvatarUrl: string;
  selectedFrame: AvatarFrameKey;
  fallbackInitials: string;
  onClose: () => void;
  onApply: (avatarUrl: string | null, frame: AvatarFrameKey) => void;
}

const AvatarPickerModal = ({
  isOpen,
  selectedAvatarUrl,
  selectedFrame,
  fallbackInitials,
  onClose,
  onApply,
}: AvatarPickerModalProps) => {
  const [draftAvatarUrl, setDraftAvatarUrl] = useState(selectedAvatarUrl);
  const [draftFrame, setDraftFrame] = useState<AvatarFrameKey>(selectedFrame);

  useEffect(() => {
    if (!isOpen) return;

    setDraftAvatarUrl(selectedAvatarUrl);
    setDraftFrame(selectedFrame);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, selectedAvatarUrl, selectedFrame]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const frameStyles = useMemo(() => getAvatarFrameStyles(draftFrame), [draftFrame]);
  const previewAvatar = normalizeAvatarUrl(safeImageSrc(draftAvatarUrl) ?? "");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[98] flex items-end justify-center p-2 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-picker-title"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(20,16,12,0.5)] backdrop-blur-[2px]"
        style={{ animation: "backdropFadeIn 180ms ease-out both" }}
        aria-label="Close avatar picker"
      />

      <section
        className="panel relative flex w-full max-w-3xl max-h-[88dvh] flex-col overflow-hidden p-4 sm:max-h-[86vh] sm:p-5 animate-scale-in"
        style={{ touchAction: "pan-y" }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="avatar-picker-title" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
              Avatar Picker
            </h3>
            <p className="mt-1 text-[0.76rem]" style={{ color: "var(--text-muted)" }}>
              Choose a trainer portrait and frame style.
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary !px-2 !py-1.5" aria-label="Close avatar picker">
            <FiX size={14} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Trainer Portraits
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDraftAvatarUrl(preset.url)}
                    className="rounded-xl border p-2 text-center text-xs transition-all"
                    style={{
                      borderColor: draftAvatarUrl === preset.url ? "rgba(218, 44, 67, 0.42)" : "var(--border)",
                      background: draftAvatarUrl === preset.url ? "var(--accent-soft)" : "var(--surface-2)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Image
                      src={preset.url}
                      alt={preset.label}
                      width={56}
                      height={56}
                      sizes="56px"
                      unoptimized
                      className="mx-auto h-14 w-14 rounded-lg object-cover"
                    />
                    <span className="mt-1 block">{preset.label}</span>
                  </button>
                ))}
              </div>

              <label className="mt-3 block">
                <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  <FiImage size={12} />
                  Custom Image URL
                </span>
                <input
                  value={draftAvatarUrl}
                  onChange={(event) => setDraftAvatarUrl(event.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
                  placeholder="https://... or /avatars/..."
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                Pokemon Frame
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AVATAR_FRAME_OPTIONS.map((frame) => {
                  const style = getAvatarFrameStyles(frame.key);
                  const active = draftFrame === frame.key;
                  return (
                    <button
                      key={frame.key}
                      type="button"
                      onClick={() => setDraftFrame(frame.key)}
                      className="rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all"
                      style={{
                        borderColor: active ? style.border : "var(--border)",
                        background: active ? style.chipBg : "var(--surface-2)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {frame.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
                  Preview
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border-2"
                    style={{
                      borderColor: frameStyles.border,
                      boxShadow: frameStyles.glow,
                      background: "rgba(10, 16, 34, 0.72)",
                    }}
                  >
                    {previewAvatar ? (
                      <Image
                        src={previewAvatar}
                        alt="Avatar preview"
                        width={56}
                        height={56}
                        sizes="56px"
                        unoptimized
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                        {fallbackInitials}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Frame: <span style={{ color: "var(--text-primary)" }}>{draftFrame}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={() => setDraftAvatarUrl("")} className="btn-secondary">
            Clear Avatar
          </button>
          <button
            type="button"
            onClick={() => onApply(draftAvatarUrl.trim() || null, draftFrame)}
            className="btn-secondary !justify-center"
            style={{ borderColor: "rgba(218, 44, 67, 0.45)", background: "var(--accent-soft)" }}
          >
            <FiCheck size={13} />
            Apply
          </button>
        </div>
      </section>
    </div>
  );
};

export default AvatarPickerModal;
