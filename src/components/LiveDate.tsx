"use client";

import { useSyncExternalStore } from "react";

function currentDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

// A stable server placeholder avoids caching a date or causing hydration mismatches.
const serverDate = () => "";

export function LiveDate() {
  const date = useSyncExternalStore(subscribe, currentDate, serverDate);
  return (
    <time className="live-date" dateTime={date || undefined}>
      {date
        ? new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(`${date}T12:00:00`))
        : "—"}
    </time>
  );
}
