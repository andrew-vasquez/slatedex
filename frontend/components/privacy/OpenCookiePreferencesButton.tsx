"use client";

import { openCookiePreferences } from "@/lib/privacy";

export default function OpenCookiePreferencesButton() {
  return (
    <button type="button" className="btn-secondary" onClick={openCookiePreferences}>
      Open Cookie Preferences
    </button>
  );
}
